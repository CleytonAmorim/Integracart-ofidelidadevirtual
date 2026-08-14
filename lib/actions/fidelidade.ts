"use server";

import { createClient } from "@/lib/supabase/server";

export type ConfiguracaoFidelidade = {
  comprasParaPremio: number;
  descricaoPremio: string;
  comprasParaDesconto: number;
  descontoDescricao: string;
};

/**
 * Busca a configuração de fidelidade do estabelecimento do usuário logado.
 * Não recebe estabelecimentoId: a RLS ("select config do proprio
 * estabelecimento") já restringe a query a exatamente 1 linha, então um
 * select sem filtro extra já devolve a linha certa (mesmo padrão de
 * buscarEstabelecimentoAtual).
 */
export async function buscarConfiguracaoFidelidade(): Promise<ConfiguracaoFidelidade | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("configuracao_fidelidade")
    .select("compras_para_premio, descricao_premio, compras_para_desconto, desconto_descricao")
    .maybeSingle();

  if (error || !data) return null;

  return {
    comprasParaPremio: data.compras_para_premio,
    descricaoPremio: data.descricao_premio,
    comprasParaDesconto: data.compras_para_desconto,
    descontoDescricao: data.desconto_descricao,
  };
}
