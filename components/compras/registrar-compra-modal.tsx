"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { registrarCompra } from "@/lib/actions/compras";
import { useToast } from "@/components/ui/toast";

type RegistrarCompraModalProps = {
  clienteId: string;
  clienteNome: string;
  /** Estilo do botão que abre o modal — "icone" cabe no card compacto de /clientes. */
  variante?: "primario" | "icone";
};

/**
 * Modal de registro de compra — usado tanto no card de /clientes (ação
 * rápida sem sair da tela) quanto, futuramente, na página de perfil do
 * cliente (item 6). Mesma convenção de useTransition + submit manual do
 * ClienteFormModal (ver esse arquivo para o racional sobre evitar
 * useActionState + useEffect aqui).
 */
export function RegistrarCompraModal({ clienteId, clienteNome, variante = "primario" }: RegistrarCompraModalProps) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | undefined>(undefined);
  const [pendente, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { mostrarToast } = useToast();

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErro(undefined);

    startTransition(async () => {
      const resultado = await registrarCompra({}, formData);
      if (resultado.sucesso) {
        setAberto(false);
        formRef.current?.reset();
        mostrarToast(
          "sucesso",
          resultado.pontos !== undefined
            ? `Compra registrada — ${clienteNome} agora tem ${resultado.pontos} ponto${resultado.pontos === 1 ? "" : "s"}.`
            : `Compra registrada para ${clienteNome}.`,
        );
        router.refresh();
      } else {
        setErro(resultado.erro ?? "Não foi possível registrar a compra.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          // stopPropagation defensivo: este botão fica ao lado de <Link>s
          // para o perfil do cliente (ver ClienteCard) — evita que um clique
          // aqui borbulhe para qualquer coisa clicável em volta.
          e.preventDefault();
          e.stopPropagation();
          setAberto(true);
        }}
        title="Registrar compra"
        className={
          variante === "primario"
            ? "rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            : "w-9 h-9 rounded-lg flex items-center justify-center text-base border border-[var(--border)] text-[var(--brand-accent)] hover:bg-[var(--surface-2)] transition-colors shrink-0"
        }
        style={
          variante === "primario"
            ? { background: "linear-gradient(135deg, var(--brand-primary-2), var(--brand-accent))" }
            : undefined
        }
      >
        {variante === "primario" ? "Registrar compra" : "＋"}
      </button>

      {aberto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setAberto(false);
          }}
        >
          <div
            className="glass w-full max-w-sm p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Registrar compra — {clienteNome}</h2>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAberto(false);
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form ref={formRef} onSubmit={aoEnviar} className="flex flex-col gap-4">
              <input type="hidden" name="clienteId" value={clienteId} />

              <div className="flex flex-col gap-1">
                <label htmlFor="valor" className="text-xs text-[var(--text-secondary)]">
                  Valor da compra (R$)
                </label>
                <input
                  id="valor"
                  name="valor"
                  type="text"
                  inputMode="decimal"
                  required
                  autoFocus
                  placeholder="0,00"
                  className="rounded-xl px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-accent)] transition-colors"
                />
              </div>

              {erro ? (
                <p className="text-sm text-[var(--erro)]" role="alert">
                  {erro}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pendente}
                className="mt-1 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60 transition-opacity"
                style={{
                  background: "linear-gradient(135deg, var(--brand-primary-2), var(--brand-accent))",
                }}
              >
                {pendente ? "Registrando..." : "Registrar"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
