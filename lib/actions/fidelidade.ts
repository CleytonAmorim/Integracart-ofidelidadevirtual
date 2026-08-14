"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buscarEstabelecimentoAtual } from "@/lib/actions/estabelecimento";

export type ConfiguracaoFidelidade = {
  pontosPorCompra: number;
  comprasParaPremio: number;
  descricaoPremio: string;
  comprasParaDesconto: number;
  descontoDescricao: string;
  diasParaAtencao: number;
  diasParaInativo: number;
};

/**
 * Busca a configuração de fidelidade do estabelecimento do usuário logado.
 * Não recebe estabelecimentoId: a RLS ("select config do proprio
 * estabelecimento") já restringe a query a exatamente 1 linha, então um
 * select sem filtro extra já devolve a linha certa (mesmo padrão de
 * buscarEstabelecimentoAtual). Usada tanto para calcular pontos/prêmio/desconto
 * quanto para classificar clientes (ativo/atenção/inativo, ver
 * lib/utils/classificacao.ts) e para pré-preencher o formulário de /configuracoes.
 */
export async function buscarConfiguracaoFidelidade(): Promise<ConfiguracaoFidelidade | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("configuracao_fidelidade")
    .select(
      "pontos_por_compra, compras_para_premio, descricao_premio, compras_para_desconto, desconto_descricao, dias_para_atencao, dias_para_inativo",
    )
    .maybeSingle();

  if (error || !data) return null;

  return {
    pontosPorCompra: data.pontos_por_compra,
    comprasParaPremio: data.compras_para_premio,
    descricaoPremio: data.descricao_premio,
    comprasParaDesconto: data.compras_para_desconto,
    descontoDescricao: data.desconto_descricao,
    diasParaAtencao: data.dias_para_atencao,
    diasParaInativo: data.dias_para_inativo,
  };
}

export type AtualizarConfiguracaoState = {
  erro?: string;
  sucesso?: boolean;
};

/**
 * Atualiza as regras do programa de fidelidade (/configuracoes) — 1 linha só
 * (PK = estabelecimento_id), sem soma/subtração cruzando linhas, então vai
 * direto pelo `update()` do supabase-js (mesmo padrão de atualizarCliente),
 * sem precisar de RPC. A RLS ("update config do proprio estabelecimento")
 * já impede editar a config de outro estabelecimento, mas o filtro por
 * estabelecimento_id aqui também é necessário: sem nenhum `.eq(...)`, o
 * supabase-js recusa um update sem filtro (proteção contra "UPDATE sem
 * WHERE" atualizar a tabela inteira).
 */
export async function atualizarConfiguracaoFidelidade(
  _prevState: AtualizarConfiguracaoState,
  formData: FormData,
): Promise<AtualizarConfiguracaoState> {
  const estabelecimento = await buscarEstabelecimentoAtual();
  if (!estabelecimento) {
    return { erro: "Sessão expirada. Faça login novamente." };
  }

  const pontosPorCompra = Number(formData.get("pontosPorCompra"));
  const comprasParaPremio = Number(formData.get("comprasParaPremio"));
  const descricaoPremio = String(formData.get("descricaoPremio") ?? "").trim();
  const comprasParaDesconto = Number(formData.get("comprasParaDesconto"));
  const descontoDescricao = String(formData.get("descontoDescricao") ?? "").trim();
  const diasParaAtencao = Number(formData.get("diasParaAtencao"));
  const diasParaInativo = Number(formData.get("diasParaInativo"));

  const camposInteiroPositivo = [
    pontosPorCompra,
    comprasParaPremio,
    comprasParaDesconto,
    diasParaAtencao,
    diasParaInativo,
  ];
  if (camposInteiroPositivo.some((n) => !Number.isInteger(n) || n <= 0)) {
    return { erro: "Todos os números precisam ser inteiros maiores que zero." };
  }
  if (!descricaoPremio) {
    return { erro: "Descreva o prêmio (ex.: \"1 sorvete grande grátis\")." };
  }
  if (!descontoDescricao) {
    return { erro: "Descreva o desconto de meio de ciclo (ex.: \"10% de desconto na próxima compra\")." };
  }
  if (comprasParaDesconto >= comprasParaPremio) {
    return { erro: "O desconto de meio de ciclo precisa acontecer antes do prêmio (menos compras que o prêmio)." };
  }
  if (diasParaInativo <= diasParaAtencao) {
    return { erro: "\"Dias para inativo\" precisa ser maior que \"dias para atenção\"." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracao_fidelidade")
    .update({
      pontos_por_compra: pontosPorCompra,
      compras_para_premio: comprasParaPremio,
      descricao_premio: descricaoPremio,
      compras_para_desconto: comprasParaDesconto,
      desconto_descricao: descontoDescricao,
      dias_para_atencao: diasParaAtencao,
      dias_para_inativo: diasParaInativo,
    })
    .eq("estabelecimento_id", estabelecimento.id);

  if (error) {
    return { erro: "Não foi possível salvar as configurações. Tente novamente." };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  return { sucesso: true };
}
