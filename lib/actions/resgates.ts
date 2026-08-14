"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ResgatarPremioState = {
  erro?: string;
  sucesso?: boolean;
  pontos?: number;
};

/**
 * Resgata o prêmio do cliente via RPC `resgatar_premio` (migração 0007) —
 * grava o resgate e desconta os pontos numa única transação no banco, pelo
 * mesmo motivo de atomicidade das demais ações de compra (evita resgate
 * duplo por cliques concorrentes).
 */
export async function resgatarPremio(
  _prevState: ResgatarPremioState,
  formData: FormData,
): Promise<ResgatarPremioState> {
  const clienteId = String(formData.get("clienteId") ?? "");

  if (!clienteId) {
    return { erro: "Cliente inválido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("resgatar_premio", { p_cliente_id: clienteId })
    .single();

  if (error || !data) {
    const mensagemInsuficiente = error?.message?.includes("insuficientes");
    return {
      erro: mensagemInsuficiente
        ? "Este cliente ainda não tem pontos suficientes para o prêmio."
        : "Não foi possível resgatar o prêmio. Tente novamente.",
    };
  }

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/clientes");
  revalidatePath("/dashboard");

  return { sucesso: true, pontos: data.pontos };
}
