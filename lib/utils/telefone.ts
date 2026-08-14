/** Remove tudo que não é dígito (útil para normalizar telefone digitado de qualquer jeito). */
export function normalizaTelefone(valor: string): string {
  return (valor ?? "").replace(/\D/g, "");
}

/** Formata um telefone só-dígitos em "(DD) 9XXXX-XXXX" ou "(DD) XXXX-XXXX". */
export function formataTelefone(digitos: string): string {
  const limpo = normalizaTelefone(digitos);
  if (limpo.length <= 10) {
    return limpo.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return limpo.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

/** Telefone válido = DDD (2 dígitos) + número (8 ou 9 dígitos) = 10 ou 11 dígitos. */
export function telefoneValido(digitos: string): boolean {
  const limpo = normalizaTelefone(digitos);
  return limpo.length === 10 || limpo.length === 11;
}
