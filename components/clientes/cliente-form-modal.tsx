"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { atualizarCliente, cadastrarCliente } from "@/lib/actions/clientes";
import { useToast } from "@/components/ui/toast";
import { formataTelefone } from "@/lib/utils/telefone";

type ClienteFormModalProps = {
  /** "cadastro" (default) cria um cliente novo; "editar" atualiza nome/telefone de um existente. */
  modo?: "cadastro" | "editar";
  /** Obrigatório quando modo === "editar". */
  clienteId?: string;
  /** Texto do botão que abre o modal. */
  textoBotao: string;
  /** Nome pré-preenchido ao abrir (ex.: quando a busca já indicava um nome, ou os dados atuais no modo editar). */
  nomeInicial?: string;
  /** Telefone pré-preenchido ao abrir (dígitos), ex.: fluxo "outra pessoa com esse telefone" ou os dados atuais no modo editar. */
  telefoneInicial?: string;
  variante?: "primario" | "secundario" | "icone";
};

/**
 * Modal de cadastro rápido de cliente E de edição de dados do cliente (item
 * 6) — mesmo componente, dois modos, trocando só a Server Action chamada e
 * o texto/título (ver arquitetura, "componentes/clientes/cliente-form-modal").
 *
 * Chama a Server Action diretamente num handler de submit (em vez de
 * useActionState) para poder fechar o modal e dar refresh() só depois que o
 * resultado chega — fazer isso a partir de um useEffect observando o estado
 * do useActionState dispara setState síncrono dentro de efeito, o que o
 * lint do React (react-hooks/set-state-in-effect) sinaliza corretamente
 * como um cheiro de código a evitar.
 */
export function ClienteFormModal({
  modo = "cadastro",
  clienteId,
  textoBotao,
  nomeInicial = "",
  telefoneInicial = "",
  variante = "primario",
}: ClienteFormModalProps) {
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
      const resultado =
        modo === "editar" ? await atualizarCliente({}, formData) : await cadastrarCliente({}, formData);

      if (resultado.sucesso) {
        setAberto(false);
        if (modo === "cadastro") formRef.current?.reset();
        mostrarToast("sucesso", modo === "editar" ? "Dados do cliente atualizados." : "Cliente cadastrado.");
        router.refresh();
      } else {
        setErro(resultado.erro ?? "Não foi possível salvar.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        title={modo === "editar" ? "Editar dados do cliente" : undefined}
        className={
          variante === "primario"
            ? "rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            : variante === "icone"
              ? "w-9 h-9 rounded-lg flex items-center justify-center text-base border border-[var(--border)] text-[var(--brand-accent)] hover:bg-[var(--surface-2)] transition-colors shrink-0"
              : "rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--brand-accent)] border border-[var(--border)] transition-colors hover:bg-[var(--surface-2)]"
        }
        style={
          variante === "primario"
            ? { background: "linear-gradient(135deg, var(--brand-primary-2), var(--brand-accent))" }
            : undefined
        }
      >
        {textoBotao}
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
              <h2 className="text-base font-bold">
                {modo === "editar" ? "Editar cliente" : "Cadastrar cliente"}
              </h2>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form ref={formRef} onSubmit={aoEnviar} className="flex flex-col gap-4">
              {modo === "editar" && clienteId ? (
                <input type="hidden" name="clienteId" value={clienteId} />
              ) : null}

              <div className="flex flex-col gap-1">
                <label htmlFor="nome" className="text-xs text-[var(--text-secondary)]">
                  Nome
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  defaultValue={nomeInicial}
                  autoFocus
                  className="rounded-xl px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-accent)] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="telefone" className="text-xs text-[var(--text-secondary)]">
                  Telefone (com DDD)
                </label>
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  required
                  defaultValue={telefoneInicial ? formataTelefone(telefoneInicial) : ""}
                  placeholder="(31) 91234-5678"
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
                {pendente
                  ? modo === "editar"
                    ? "Salvando..."
                    : "Cadastrando..."
                  : modo === "editar"
                    ? "Salvar"
                    : "Cadastrar"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
