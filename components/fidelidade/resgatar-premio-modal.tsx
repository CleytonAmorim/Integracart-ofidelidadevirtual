"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resgatarPremio } from "@/lib/actions/resgates";
import { useToast } from "@/components/ui/toast";

type ResgatarPremioModalProps = {
  clienteId: string;
  clienteNome: string;
  descricaoPremio: string;
};

/**
 * Botão de destaque (dourado — cor reservada para prêmio/resgate, ver
 * design system) que só é renderizado pelo caller quando
 * cliente.pontos >= compras_para_premio. Abre um modal de confirmação em
 * vez de resgatar direto no clique: é uma ação que consome pontos do
 * cliente, vale um passo a mais antes de confirmar.
 */
export function ResgatarPremioModal({ clienteId, clienteNome, descricaoPremio }: ResgatarPremioModalProps) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | undefined>(undefined);
  const [pendente, startTransition] = useTransition();
  const router = useRouter();
  const { mostrarToast } = useToast();

  function confirmarResgate() {
    const formData = new FormData();
    formData.set("clienteId", clienteId);
    setErro(undefined);

    startTransition(async () => {
      const resultado = await resgatarPremio({}, formData);
      if (resultado.sucesso) {
        setAberto(false);
        mostrarToast("sucesso", `Prêmio resgatado para ${clienteNome}.`);
        router.refresh();
      } else {
        setErro(resultado.erro ?? "Não foi possível resgatar o prêmio.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#1a1200] transition-opacity hover:opacity-90 flex items-center gap-2 justify-center"
        style={{ background: "linear-gradient(135deg, var(--brand-gold), var(--brand-gold-2))" }}
      >
        🎁 Resgatar prêmio
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
              <h2 className="text-base font-bold">Confirmar resgate</h2>
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
              Resgatar <strong className="text-[var(--text-primary)]">{descricaoPremio}</strong> para{" "}
              <strong className="text-[var(--text-primary)]">{clienteNome}</strong>?
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
                onClick={confirmarResgate}
                disabled={pendente}
                className="flex-1 rounded-xl px-4 py-3 text-sm font-bold text-[#1a1200] disabled:opacity-60 transition-opacity"
                style={{ background: "linear-gradient(135deg, var(--brand-gold), var(--brand-gold-2))" }}
              >
                {pendente ? "Resgatando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
