import { createClient } from "@/lib/supabase/server";
import { gerarTema, tokensParaCss } from "@/lib/theme/tokens";
import { retryUmaVez } from "@/lib/utils/retry";

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
  } = await retryUmaVez(() => supabase.auth.getUser());
  if (!user) return null;

  // retryUmaVez (não só no catch, também no `error` retornado): o
  // PostgREST às vezes rejeita o JWT recém-emitido logo após um login novo
  // ("JWT issued at future", transitório — ver lib/utils/retry.ts) sem
  // necessariamente lançar exceção, só devolvendo error preenchido. Sem o
  // retry aqui, isso era tratado como "sem vínculo" e mandava de volta pro
  // login por engano, mesmo o usuário estando de fato logado.
  const buscarVinculo = async () => {
    const resultado = await supabase
      .from("usuarios_estabelecimento")
      .select("nome, estabelecimento_id")
      .eq("id", user.id)
      .single();
    if (resultado.error) throw resultado.error;
    return resultado.data;
  };
  const vinculo = await retryUmaVez(buscarVinculo).catch(() => null);
  if (!vinculo) return null;

  const buscarEstabelecimento = async () => {
    const resultado = await supabase
      .from("estabelecimentos")
      .select("id, nome, cor_primaria, cor_destaque, logo_url")
      .eq("id", vinculo.estabelecimento_id)
      .single();
    if (resultado.error) throw resultado.error;
    return resultado.data;
  };
  const estabelecimento = await retryUmaVez(buscarEstabelecimento).catch(() => null);
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
