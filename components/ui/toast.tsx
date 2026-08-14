"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type TipoToast = "sucesso" | "erro";

type Toast = {
  id: number;
  tipo: TipoToast;
  mensagem: string;
};

type ToastContextValue = {
  mostrarToast: (tipo: TipoToast, mensagem: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DURACAO_MS = 3500;

/**
 * Provider de toasts — envolve o painel autenticado (ver (app)/layout.tsx)
 * para que qualquer Client Component filho (modais de cadastro, registro de
 * compra, resgate, etc.) possa disparar feedback visual pós-ação via
 * useToast(), sem precisar de estado próprio nem prop drilling.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const proximoId = useRef(0);

  const mostrarToast = useCallback((tipo: TipoToast, mensagem: string) => {
    const id = proximoId.current++;
    setToasts((atual) => [...atual, { id, tipo, mensagem }]);
    setTimeout(() => {
      setToasts((atual) => atual.filter((toast) => toast.id !== id));
    }, DURACAO_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}

      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="glass pointer-events-auto flex items-center gap-2 px-4 py-3 text-sm font-medium shadow-lg"
            style={{
              borderColor:
                toast.tipo === "sucesso" ? "var(--sucesso)" : "var(--erro)",
              color: toast.tipo === "sucesso" ? "var(--sucesso)" : "var(--erro)",
            }}
          >
            <span aria-hidden="true">{toast.tipo === "sucesso" ? "✓" : "✕"}</span>
            <span className="text-[var(--text-primary)]">{toast.mensagem}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Lança se usado fora do ToastProvider — sinaliza cedo um erro de composição
 * em vez de falhar silenciosamente (toast nunca aparece) em produção.
 */
export function useToast(): ToastContextValue {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error("useToast precisa ser usado dentro de <ToastProvider>.");
  }
  return contexto;
}
