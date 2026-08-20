"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { excluirCliente } from "@/lib/actions/clientes";
import { useToast } from "@/components/ui/toast";

type ExcluirClienteBotaoProps = {
  clienteId: string;
  clienteNome: string;
};

/**
 * Ação destrutiva e irreversível (exclui compras/resgates junto, em cascata
 * no banco) — sempre atrás de um modal de confirmação nomeando o cliente,
 * nunca direto no clique. Depois de excluir, volta para /clientes (a página
 * atual, /clientes/[id], deixa de existir).
 */
export function ExcluirClienteBotao({ clienteId, clienteNome }: ExcluirClienteBotaoProps) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | undefined>(undefined);
  const [pendente, startTransition] = useTransition();
  const router = useRouter();
  const { mostrarToast } = useToast();

  function confirmarExclusao() {
    setErro(undefined);
    startTransition(async () => {
      const resultado = await excluirCliente(clienteId);
      if (resultado.erro) {
        setErro(resultado.erro);
        return;
      }
      mostrarToast("sucesso", `${clienteNome} excluído.`);
      router.push("/clientes");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Excluir cliente"
        className="text-[var(--text-muted)] hover:text-[var(--erro)] transition-colors shrink-0"
      >
        🗑
      </button>

      {aberto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setAberto(false)}
        >
          <div
            className="glass w-full max-w-sm p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Excluir cliente</h2>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[var(--text-secondary)]">
              Excluir <strong className="text-[var(--text-primary)]">{clienteNome}</strong>? Isso apaga também
              todo o histórico de compras e resgates dele. Não tem como desfazer.
            </p>

            {erro ? (
              <p className="text-sm text-[var(--erro)]" role="alert">
                {erro}
              </p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={pendente}
                className="flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-60 transition-opacity bg-[var(--erro)]"
              >
                {pendente ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
