import { createClient } from "@/lib/supabase/server";
import { gerarTema, tokensParaCss } from "@/lib/theme/tokens";

export type EstabelecimentoAtual = {
  id: string;
  nome: string;
  logoUrl: string | null;
  nomeUsuario: string;
  temaCss: string;
};

/**
 * Busca o estabelecimento do usuário autenticado (via usuarios_estabelecimento)
 * e gera o CSS do tema a partir das 2 cores configuradas. Usado no layout do
 * grupo (app) para tematizar o painel do atendente.
 *
 * Duas queries simples (em vez de um select com embed) de propósito: os tipos
 * do banco ainda são escritos à mão (ver types/database.ts) e não carregam
 * metadados de relacionamento, então o embed do supabase-js não tipa direito
 * ainda. Trocar por embed quando os tipos forem gerados via CLI.
 *
 * Retorna null se o usuário não estiver logado ou não pertencer a nenhum
 * estabelecimento (não deveria acontecer em rotas já protegidas pelo proxy,
 * mas o caller deve tratar o null com um redirect defensivo).
 */
export async function buscarEstabelecimentoAtual(): Promise<EstabelecimentoAtual | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vinculo } = await supabase
    .from("usuarios_estabelecimento")
    .select("nome, estabelecimento_id")
    .eq("id", user.id)
    .single();
  if (!vinculo) return null;

  const { data: estabelecimento } = await supabase
    .from("estabelecimentos")
    .select("id, nome, cor_primaria, cor_destaque, logo_url")
    .eq("id", vinculo.estabelecimento_id)
    .single();
  if (!estabelecimento) return null;

  const tokens = gerarTema(estabelecimento.cor_primaria, estabelecimento.cor_destaque);

  return {
    id: estabelecimento.id,
    nome: estabelecimento.nome,
    logoUrl: estabelecimento.logo_url,
    nomeUsuario: vinculo.nome,
    temaCss: tokensParaCss(tokens),
  };
}
