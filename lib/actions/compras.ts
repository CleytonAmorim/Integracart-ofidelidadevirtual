"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RegistroCompraState = {
  erro?: string;
  sucesso?: boolean;
  pontos?: number;
};

/**
 * Registra uma compra chamando a RPC `registrar_compra` (ver migração
 * 0004_registrar_compra.sql) — insere a compra E atualiza
 * pontos/total_gasto/ultima_compra_em do cliente numa única transação no
 * banco, evitando condição de corrida entre dois registros concorrentes
 * para o mesmo cliente (o valor de `pontos` não pode ser lido e regravado
 * aqui na Server Action sem risco de perder incremento).
 *
 * `clienteId` chega como campo escondido do form (mesma convenção de
 * cadastrarCliente), não como argumento extra da action.
 */
export async function registrarCompra(
  _prevState: RegistroCompraState,
  formData: FormData,
): Promise<RegistroCompraState> {
  const clienteId = String(formData.get("clienteId") ?? "");
  const valorBruto = String(formData.get("valor") ?? "").trim().replace(",", ".");
  const valor = Number(valorBruto);

  if (!clienteId) {
    return { erro: "Cliente inválido." };
  }
  if (!valorBruto || Number.isNaN(valor) || valor <= 0) {
    return { erro: "Informe um valor de compra válido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("registrar_compra", { p_cliente_id: clienteId, p_valor: valor })
    .single();

  if (error || !data) {
    return { erro: "Não foi possível registrar a compra. Tente novamente." };
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/dashboard");

  return { sucesso: true, pontos: data.pontos };
}
