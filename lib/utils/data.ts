const FUSO_ESTABELECIMENTO = "America/Sao_Paulo";

function diaEm(data: Date, fuso: string): string {
  // en-CA formata como AAAA-MM-DD — string comparável direto, sem parsing.
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuso }).format(data);
}

/**
 * "Hoje" no fuso do estabelecimento (Brasil), não no fuso do servidor nem do
 * navegador de quem estiver olhando. Usa a mesma definição das funções do
 * banco que restringem edição/exclusão de compra ao dia do registro
 * (editar_valor_compra / excluir_compra, migração 0006) — comparar em UTC
 * daria um resultado diferente do banco perto da meia-noite no Brasil.
 */
export function ehHoje(iso: string): boolean {
  return diaEm(new Date(iso), FUSO_ESTABELECIMENTO) === diaEm(new Date(), FUSO_ESTABELECIMENTO);
}
