"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { editarCompra, excluirCompra, type CompraItem } from "@/lib/actions/compras";
import { useToast } from "@/components/ui/toast";
import { ehHoje } from "@/lib/utils/data";

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Modo = "visualizar" | "editar" | "confirmarExclusao";

/**
 * Uma linha do histórico de compras — estado próprio (editar/excluir) por
 * linha, em vez de estado compartilhado em HistoricoCompras, porque cada
 * linha edita/exclui de forma independente das outras.
 *
 * `editavel` usa a mesma definição de "hoje" (fuso America/Sao_Paulo) que as
 * RPCs editar_valor_compra/excluir_compra já aplicam no banco (migração
 * 0006) — aqui é só para a UI (cadeado/esconder botões); a restrição de
 * verdade está no banco, não confiar só nisso.
 */
export function HistoricoCompraLinha({ clienteId, compra }: { clienteId: string; compra: CompraItem }) {
  const editavel = ehHoje(compra.criadoEm);
  const [modo, setModo] = useState<Modo>("visualizar");
  const [erro, setErro] = useState<string | undefined>(undefined);
  const [pendente, startTransition] = useTransition();
  const router = useRouter();
  const { mostrarToast } = useToast();

  function salvarEdicao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErro(undefined);

    startTransition(async () => {
      const resultado = await editarCompra({}, formData);
      if (resultado.sucesso) {
        setModo("visualizar");
        mostrarToast("sucesso", "Valor da compra atualizado.");
        router.refresh();
      } else {
        setErro(resultado.erro ?? "Não foi possível editar a compra.");
      }
    });
  }

  function confirmarExclusao() {
    const formData = new FormData();
    formData.set("compraId", compra.id);
    formData.set("clienteId", clienteId);

    startTransition(async () => {
      const resultado = await excluirCompra({}, formData);
      if (resultado.sucesso) {
        mostrarToast("sucesso", "Compra excluída.");
        router.refresh();
      } else {
        setModo("visualizar");
        mostrarToast("erro", resultado.erro ?? "Não foi possível excluir a compra.");
      }
    });
  }

  if (modo === "editar") {
    return (
      <form onSubmit={salvarEdicao} className="glass p-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="compraId" value={compra.id} />
        <input type="hidden" name="clienteId" value={clienteId} />
        <input
          name="valor"
          type="text"
          inputMode="decimal"
          defaultValue={compra.valor.toFixed(2).replace(".", ",")}
          autoFocus
          className="flex-1 min-w-0 rounded-lg px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-accent)] transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={pendente}
          className="text-xs font-semibold text-[var(--brand-accent)] disabled:opacity-60"
        >
          {pendente ? "..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => setModo("visualizar")}
          className="text-xs text-[var(--text-muted)]"
        >
          Cancelar
        </button>
        {erro ? (
          <p className="text-xs text-[var(--erro)] basis-full" role="alert">
            {erro}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="glass p-3 flex items-center justify-between gap-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-semibold">{formatarMoeda(compra.valor)}</span>
        <span className="text-xs text-[var(--text-muted)]">
          {formatarDataHora(compra.criadoEm)} · +{compra.pontosGerados} ponto{compra.pontosGerados === 1 ? "" : "s"}
        </span>
      </div>

      {!editavel ? (
        <span
          className="text-[var(--text-muted)] shrink-0"
          title="Compra de outro dia — não pode mais ser editada ou excluída"
          aria-label="Compra bloqueada para edição"
        >
          🔒
        </span>
      ) : modo === "confirmarExclusao" ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[var(--text-secondary)]">Excluir?</span>
          <button
            type="button"
            onClick={confirmarExclusao}
            disabled={pendente}
            className="text-xs font-semibold text-[var(--erro)] disabled:opacity-60"
          >
            {pendente ? "..." : "Sim"}
          </button>
          <button
            type="button"
            onClick={() => setModo("visualizar")}
            className="text-xs text-[var(--text-muted)]"
          >
            Não
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setModo("editar")}
            className="w-7 h-7 rounded-md flex items-center justify-center text-sm border border-[var(--border)] text-[var(--brand-accent)] hover:bg-[var(--surface-2)] transition-colors"
            aria-label="Editar valor da compra"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={() => setModo("confirmarExclusao")}
            className="w-7 h-7 rounded-md flex items-center justify-center text-sm border border-[var(--border)] text-[var(--erro)] hover:bg-[var(--surface-2)] transition-colors"
            aria-label="Excluir compra"
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
}
