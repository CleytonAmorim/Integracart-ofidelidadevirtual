"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/actions/auth";

const estadoInicial: LoginState = {};

export function LoginForm() {
  const [state, formAction, pendente] = useActionState(login, estadoInicial);

  return (
    <form action={formAction} className="glass w-full max-w-sm p-8 flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 mb-2">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
          style={{
            background: "linear-gradient(135deg, var(--brand-primary), var(--brand-primary-2))",
          }}
        >
          🍦
        </div>
        <h1 className="text-lg font-bold">Cartão Fidelidade Digital</h1>
        <p className="text-sm text-[var(--text-muted)]">Acesse o painel do seu estabelecimento</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-xs text-[var(--text-secondary)]">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-xl px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-accent)] transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="senha" className="text-xs text-[var(--text-secondary)]">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-xl px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-accent)] transition-colors"
        />
      </div>

      {state?.erro ? (
        <p className="text-sm text-[var(--erro)]" role="alert">
          {state.erro}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pendente}
        className="mt-2 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60 transition-opacity"
        style={{
          background: "linear-gradient(135deg, var(--brand-primary-2), var(--brand-accent))",
        }}
      >
        {pendente ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
