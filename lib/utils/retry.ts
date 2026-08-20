/**
 * Tenta `fn()` de novo 1 vez, depois de um pequeno atraso, se a primeira
 * tentativa lançar uma exceção — usado especificamente para absorver o erro
 * transitório "JWT issued at future" (PGRST303) que o PostgREST às vezes
 * devolve logo depois de um login novo (desalinhamento de relógio interno
 * entre os serviços da própria Supabase, não algo sob nosso controle — ver
 * lib/supabase/proxy.ts e lib/actions/estabelecimento.ts). Não é um retry
 * genérico de resiliência: só existe pra cobrir essa janela curta pós-login.
 */
export async function retryUmaVez<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return fn();
  }
}
