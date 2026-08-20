"use server";

import { createClient } from "@/lib/supabase/server";
import { classificarCliente, type StatusCliente } from "@/lib/utils/classificacao";

export type CompraRecente = {
  id: string;
  clienteId: string;
  clienteNome: string;
  valor: number;
  criadoEm: string;
};

export type Aniversariante = {
  id: string;
  nome: string;
  dia: number;
};

export type DashboardDados = {
  totalClientes: number;
  pontosEmAberto: number;
  totalGastoAcumulado: number;
  comprasHoje: number;
  porStatus: Record<StatusCliente, number>;
  comprasRecentes: CompraRecente[];
  aniversariantesMes: Aniversariante[];
};

/**
 * Dados agregados para /dashboard (item 10). RLS já restringe tudo ao
 * estabelecimento do usuário logado.
 *
 * Escala: para o volume de 1 estabelecimento piloto (Frio a Frio), buscar
 * todos os clientes e agregar/classificar em JS é simples e suficiente — a
 * classificação em si já é sempre calculada em tempo de leitura (nunca uma
 * coluna, ver lib/utils/classificacao.ts). Se o número de clientes crescer
 * muito, isso vira um bom candidato a mover para agregação no banco (view
 * ou RPC com count/sum), mas não vale a complexidade agora.
 */
export async function buscarDadosDashboard(): Promise<DashboardDados | null> {
  const supabase = await createClient();

  const [{ data: clientes, error: erroClientes }, { data: config }] = await Promise.all([
    supabase.from("clientes").select("id, nome, pontos, total_gasto, ultima_compra_em, data_nascimento"),
    supabase
      .from("configuracao_fidelidade")
      .select("dias_para_atencao, dias_para_inativo")
      .maybeSingle(),
  ]);

  if (erroClientes || !clientes) return null;

  const diasParaAtencao = config?.dias_para_atencao ?? 30;
  const diasParaInativo = config?.dias_para_inativo ?? 60;

  const porStatus: Record<StatusCliente, number> = { ativo: 0, atencao: 0, inativo: 0 };
  let pontosEmAberto = 0;
  let totalGastoAcumulado = 0;

  // Mês atual no fuso America/Sao_Paulo, mesmo racional do "hoje" mais abaixo
  // — evita o mês virar errado pra quem está perto da meia-noite/virada de mês.
  const mesAtual = Number(
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", month: "numeric" }).format(new Date()),
  );
  const aniversariantesMes: Aniversariante[] = [];

  for (const cliente of clientes) {
    pontosEmAberto += cliente.pontos;
    totalGastoAcumulado += Number(cliente.total_gasto);
    const status = classificarCliente(cliente.ultima_compra_em, diasParaAtencao, diasParaInativo);
    porStatus[status] += 1;

    if (cliente.data_nascimento) {
      // data_nascimento vem "YYYY-MM-DD" — parse direto da string (sem
      // `new Date(...)`) pra não sofrer o deslocamento de fuso horário que
      // interpretaria a data como meia-noite UTC.
      const [, mes, dia] = cliente.data_nascimento.split("-").map(Number);
      if (mes === mesAtual) {
        aniversariantesMes.push({ id: cliente.id, nome: cliente.nome, dia });
      }
    }
  }
  aniversariantesMes.sort((a, b) => a.dia - b.dia);

  // "Hoje" no fuso America/Sao_Paulo, mesma lógica de ehHoje() — filtrar por
  // uma data (não um intervalo de timestamp) evita erro de fuso na virada
  // da meia-noite.
  const hojeSaoPaulo = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const inicioHojeUtc = `${hojeSaoPaulo}T00:00:00-03:00`;

  const [{ count: comprasHoje }, { data: recentesBrutas }] = await Promise.all([
    supabase
      .from("compras")
      .select("id", { count: "exact", head: true })
      .gte("criado_em", inicioHojeUtc),
    supabase
      .from("compras")
      .select("id, cliente_id, valor, criado_em")
      .order("criado_em", { ascending: false })
      .limit(8),
  ]);

  // Nomes dos clientes das compras recentes buscados à parte (não via embed
  // do supabase-js) — mesmo padrão do resto do código: os tipos do banco
  // ainda são escritos à mão (ver types/database.ts) e não tipam embed
  // direito ainda.
  const idsClientes = [...new Set((recentesBrutas ?? []).map((c) => c.cliente_id))];
  const { data: nomesClientes } =
    idsClientes.length > 0
      ? await supabase.from("clientes").select("id, nome").in("id", idsClientes)
      : { data: [] as { id: string; nome: string }[] };
  const nomePorId = new Map((nomesClientes ?? []).map((c) => [c.id, c.nome]));

  const comprasRecentes: CompraRecente[] = (recentesBrutas ?? []).map((compra) => ({
    id: compra.id,
    clienteId: compra.cliente_id,
    clienteNome: nomePorId.get(compra.cliente_id) ?? "Cliente",
    valor: Number(compra.valor),
    criadoEm: compra.criado_em,
  }));

  return {
    totalClientes: clientes.length,
    pontosEmAberto,
    totalGastoAcumulado,
    comprasHoje: comprasHoje ?? 0,
    porStatus,
    comprasRecentes,
    aniversariantesMes,
  };
}
