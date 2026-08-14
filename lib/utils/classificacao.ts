export type StatusCliente = "ativo" | "atencao" | "inativo";

/**
 * Classificação calculada em tempo de leitura (não é uma coluna/tabela) a
 * partir de `ultima_compra_em` e dos limites configurados pelo estabelecimento.
 */
export function classificarCliente(
  ultimaCompraEm: string | null,
  diasParaAtencao: number,
  diasParaInativo: number,
): StatusCliente {
  if (!ultimaCompraEm) return "inativo";

  const dias = Math.floor(
    (Date.now() - new Date(ultimaCompraEm).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dias >= diasParaInativo) return "inativo";
  if (dias >= diasParaAtencao) return "atencao";
  return "ativo";
}

export const STATUS_LABEL: Record<StatusCliente, string> = {
  ativo: "Ativo",
  atencao: "Atenção",
  inativo: "Inativo",
};

export const STATUS_COR: Record<StatusCliente, string> = {
  ativo: "#0ca30c",
  atencao: "#fab219",
  inativo: "#8a80b0",
};
