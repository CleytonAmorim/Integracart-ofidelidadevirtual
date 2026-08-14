"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buscarEstabelecimentoAtual } from "@/lib/actions/estabelecimento";
import { normalizaTelefone, telefoneValido } from "@/lib/utils/telefone";
import { linkWhatsapp, mensagemBoasVindas } from "@/lib/utils/whatsapp";
import { classificarCliente, type StatusCliente } from "@/lib/utils/classificacao";

export type ClienteResumo = {
  id: string;
  nome: string;
  telefone: string;
  pontos: number;
  totalGasto: number;
  ultimaCompraEm: string | null;
  criadoEm: string;
};

/**
 * Busca clientes por nome (ILIKE) OU telefone (prefixo), combinando os dois
 * critérios numa única query (sem duplicar resultados) — ver nota "Busca por
 * nome, além de telefone" na arquitetura. RLS já restringe ao estabelecimento
 * do usuário logado, então não é preciso filtrar por estabelecimento_id aqui.
 *
 * Sem termo de busca, devolve os clientes cadastrados mais recentemente
 * (usado para a lista "clientes recentes" abaixo da busca em /clientes).
 *
 * `status` (opcional): filtro por classificação (ativo/atenção/inativo),
 * vindo dos links do dashboard ("Clientes por status", item 11 — antes só
 * mostrava a contagem, sem dar pra ver quem é quem). Não dá pra filtrar
 * direto no SQL porque status não é uma coluna — é sempre calculado em
 * tempo de leitura (ver classificarCliente) — então busca todos os que
 * batem o texto (sem o limite curto de "recentes") e filtra em JS, mesmo
 * padrão de buscarDadosDashboard; ok para o volume de 1 estabelecimento
 * piloto.
 */
export async function buscarClientes(query: string, status?: StatusCliente): Promise<ClienteResumo[]> {
  const supabase = await createClient();
  const termo = query.trim();

  const mapCliente = (cliente: {
    id: string;
    nome: string;
    telefone: string;
    pontos: number;
    total_gasto: number;
    ultima_compra_em: string | null;
    criado_em: string;
  }): ClienteResumo => ({
    id: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone,
    pontos: cliente.pontos,
    totalGasto: Number(cliente.total_gasto),
    ultimaCompraEm: cliente.ultima_compra_em,
    criadoEm: cliente.criado_em,
  });

  let request = supabase
    .from("clientes")
    .select("id, nome, telefone, pontos, total_gasto, ultima_compra_em, criado_em");

  if (termo) {
    const digitos = normalizaTelefone(termo);
    const filtros = [`nome.ilike.%${termo}%`];
    // Só entra no filtro de telefone com um mínimo de dígitos — evita que
    // um termo de nome com 1-2 números incidentais vire um prefixo de busca
    // amplo demais (ex.: buscar "Ana 2" não deveria casar telefones que
    // começam com "2").
    if (digitos.length >= 3) {
      filtros.push(`telefone.ilike.${digitos}%`);
    }
    request = request.or(filtros.join(","));
  }

  if (status) {
    const [{ data, error }, { data: config }] = await Promise.all([
      request.order("nome", { ascending: true }).limit(500),
      supabase.from("configuracao_fidelidade").select("dias_para_atencao, dias_para_inativo").maybeSingle(),
    ]);
    if (error) throw error;

    const diasParaAtencao = config?.dias_para_atencao ?? 30;
    const diasParaInativo = config?.dias_para_inativo ?? 60;
    return (data ?? [])
      .map(mapCliente)
      .filter((cliente) => classificarCliente(cliente.ultimaCompraEm, diasParaAtencao, diasParaInativo) === status);
  }

  request = termo
    ? request.order("nome", { ascending: true }).limit(20)
    : request.order("criado_em", { ascending: false }).limit(8);

  const { data, error } = await request;
  if (error) throw error;

  return (data ?? []).map(mapCliente);
}

export type CadastroClienteState = {
  erro?: string;
  sucesso?: boolean;
  /**
   * Link wa.me pronto (número + mensagem de boas-vindas com o link da
   * página pública do cliente) — o caller decide como/quando abrir, ver
   * ClienteFormModal. Só vem preenchido quando NEXT_PUBLIC_SITE_URL está
   * configurado (precisa de uma URL pública real, ver .env.example); sem
   * isso o link da página pública ficaria quebrado dentro da mensagem.
   */
  linkWhatsapp?: string;
};

/**
 * Cadastro rápido de cliente (nome + telefone) — usado no modal de /clientes,
 * seja pelo fluxo "não encontrei ninguém" ou pelo "+ cadastrar outra pessoa
 * com esse telefone". `token_publico` já é gerado automaticamente pelo banco
 * (default gen_random_uuid(), migração 0001) — aqui só lê de volta pra montar
 * o link da página pública que vai na mensagem de boas-vindas por WhatsApp.
 */
export async function cadastrarCliente(
  _prevState: CadastroClienteState,
  formData: FormData,
): Promise<CadastroClienteState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = normalizaTelefone(String(formData.get("telefone") ?? ""));

  if (!nome) {
    return { erro: "Informe o nome do cliente." };
  }
  if (!telefoneValido(telefone)) {
    return { erro: "Telefone inválido — informe DDD + número." };
  }

  const estabelecimento = await buscarEstabelecimentoAtual();
  if (!estabelecimento) {
    return { erro: "Sessão expirada. Faça login novamente." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      estabelecimento_id: estabelecimento.id,
      nome,
      telefone,
    })
    .select("token_publico")
    .single();

  if (error || !data) {
    return { erro: "Não foi possível cadastrar o cliente. Tente novamente." };
  }

  revalidatePath("/clientes");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    // Ainda não implantado (deploy na Vercel adiado por decisão do usuário,
    // ver arquitetura) — sem domínio público não tem como montar um link
    // que funcione, então o cadastro segue normal, só sem o passo de WhatsApp.
    return { sucesso: true };
  }

  const linkPublico = `${siteUrl.replace(/\/$/, "")}/c/${data.token_publico}`;
  const mensagem = mensagemBoasVindas(nome, estabelecimento.nome, linkPublico);

  return { sucesso: true, linkWhatsapp: linkWhatsapp(telefone, mensagem) };
}

export type ClienteDetalhe = {
  id: string;
  nome: string;
  telefone: string;
  pontos: number;
  totalGasto: number;
  ultimaCompraEm: string | null;
  criadoEm: string;
};

/**
 * Busca 1 cliente pelo id, para a página de perfil (/clientes/[id], item 6).
 * RLS já restringe ao estabelecimento do usuário logado — um id de outro
 * estabelecimento (ou inexistente) simplesmente não retorna linha nenhuma,
 * então trata-se igual a "não encontrado" (maybeSingle em vez de single),
 * sem vazar a diferença entre "não existe" e "não é seu" para o caller.
 */
export async function buscarClientePorId(id: string): Promise<ClienteDetalhe | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome, telefone, pontos, total_gasto, ultima_compra_em, criado_em")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    nome: data.nome,
    telefone: data.telefone,
    pontos: data.pontos,
    totalGasto: Number(data.total_gasto),
    ultimaCompraEm: data.ultima_compra_em,
    criadoEm: data.criado_em,
  };
}

export type AtualizarClienteState = {
  erro?: string;
  sucesso?: boolean;
};

/**
 * Edita nome/telefone do cliente — sem restrição de tempo (diferente da
 * edição/exclusão de compra), ver arquitetura "Editar dados do cliente".
 * Não passa por RPC: é uma atualização de 1 linha só, sem risco de
 * condição de corrida como em registrar/editar/excluir compra.
 */
export async function atualizarCliente(
  _prevState: AtualizarClienteState,
  formData: FormData,
): Promise<AtualizarClienteState> {
  const clienteId = String(formData.get("clienteId") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = normalizaTelefone(String(formData.get("telefone") ?? ""));

  if (!clienteId) {
    return { erro: "Cliente inválido." };
  }
  if (!nome) {
    return { erro: "Informe o nome do cliente." };
  }
  if (!telefoneValido(telefone)) {
    return { erro: "Telefone inválido — informe DDD + número." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").update({ nome, telefone }).eq("id", clienteId);

  if (error) {
    return { erro: "Não foi possível salvar as alterações. Tente novamente." };
  }

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/clientes");
  return { sucesso: true };
}

/**
 * Busca o id do cliente a partir do token_publico lido no QR (fluxo do
 * atendente, ScanQrModal em /clientes — diferente de buscar_cliente_publico,
 * que é a RPC anônima usada pela própria página pública do cliente). Select
 * comum, sem RPC: RLS ("select clientes do proprio estabelecimento") já
 * garante que um QR de outro estabelecimento não retorna nada — mesmo
 * padrão defensivo de buscarClientePorId (maybeSingle, trata como
 * "não encontrado" em vez de vazar a diferença entre "não existe"/"não é seu").
 */
export async function buscarClientePorToken(token: string): Promise<{ id: string; nome: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome")
    .eq("token_publico", token)
    .maybeSingle();

  if (error || !data) return null;

  return { id: data.id, nome: data.nome };
}
