"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buscarEstabelecimentoAtual } from "@/lib/actions/estabelecimento";
import { normalizaTelefone, telefoneValido } from "@/lib/utils/telefone";

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
 */
export async function buscarClientes(query: string): Promise<ClienteResumo[]> {
  const supabase = await createClient();
  const termo = query.trim();

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
    request = request.or(filtros.join(",")).order("nome", { ascending: true }).limit(20);
  } else {
    request = request.order("criado_em", { ascending: false }).limit(8);
  }

  const { data, error } = await request;
  if (error) throw error;

  return (data ?? []).map((cliente) => ({
    id: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone,
    pontos: cliente.pontos,
    totalGasto: Number(cliente.total_gasto),
    ultimaCompraEm: cliente.ultima_compra_em,
    criadoEm: cliente.criado_em,
  }));
}

export type CadastroClienteState = {
  erro?: string;
  sucesso?: boolean;
};

/**
 * Cadastro rápido de cliente (nome + telefone) — usado no modal de /clientes,
 * seja pelo fluxo "não encontrei ninguém" ou pelo "+ cadastrar outra pessoa
 * com esse telefone". Sem envio de WhatsApp/QR aqui: isso entra junto com a
 * página pública do cliente (item 8 da ordem de desenvolvimento).
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
  const { error } = await supabase.from("clientes").insert({
    estabelecimento_id: estabelecimento.id,
    nome,
    telefone,
  });

  if (error) {
    return { erro: "Não foi possível cadastrar o cliente. Tente novamente." };
  }

  revalidatePath("/clientes");
  return { sucesso: true };
}
