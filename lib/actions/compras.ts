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

export type CompraItem = {
  id: string;
  valor: number;
  pontosGerados: number;
  criadoEm: string;
};

/**
 * Histórico de compras de um cliente, mais recentes primeiro — usado na
 * página de perfil (item 6). RLS já restringe ao estabelecimento do usuário
 * logado, então não é preciso filtrar por estabelecimento_id aqui.
 */
export async function buscarComprasDoCliente(clienteId: string): Promise<CompraItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compras")
    .select("id, valor, pontos_gerados, criado_em")
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map((compra) => ({
    id: compra.id,
    valor: Number(compra.valor),
    pontosGerados: compra.pontos_gerados,
    criadoEm: compra.criado_em,
  }));
}

export type EditarCompraState = {
  erro?: string;
  sucesso?: boolean;
};

/**
 * Edita o valor de uma compra via RPC `editar_valor_compra` (migração
 * 0006) — a restrição "só compras de hoje" é aplicada no banco, não só na
 * UI (ver comentário da migração). Não recalcula pontos: a regra de pontos
 * é fixa por compra, independente do valor.
 */
export async function editarCompra(
  _prevState: EditarCompraState,
  formData: FormData,
): Promise<EditarCompraState> {
  const compraId = String(formData.get("compraId") ?? "");
  const clienteId = String(formData.get("clienteId") ?? "");
  const valorBruto = String(formData.get("valor") ?? "").trim().replace(",", ".");
  const valor = Number(valorBruto);

  if (!compraId) {
    return { erro: "Compra inválida." };
  }
  if (!valorBruto || Number.isNaN(valor) || valor <= 0) {
    return { erro: "Informe um valor válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("editar_valor_compra", {
    p_compra_id: compraId,
    p_novo_valor: valor,
  });

  if (error) {
    return { erro: "Não foi possível editar — só é possível editar compras registradas hoje." };
  }

  if (clienteId) revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/clientes");

  return { sucesso: true };
}

export type ExcluirCompraState = {
  erro?: string;
  sucesso?: boolean;
};

/**
 * Exclui uma compra via RPC `excluir_compra` (migração 0006) — desfaz o
 * efeito da compra em pontos/total_gasto/ultima_compra_em atomicamente.
 * Mesma restrição "só hoje" aplicada no banco.
 */
export async function excluirCompra(
  _prevState: ExcluirCompraState,
  formData: FormData,
): Promise<ExcluirCompraState> {
  const compraId = String(formData.get("compraId") ?? "");
  const clienteId = String(formData.get("clienteId") ?? "");

  if (!compraId) {
    return { erro: "Compra inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("excluir_compra", { p_compra_id: compraId });

  if (error) {
    return { erro: "Não foi possível excluir — só é possível excluir compras registradas hoje." };
  }

  if (clienteId) revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/clientes");

  return { sucesso: true };
}
