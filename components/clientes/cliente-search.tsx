"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

/**
 * Campo de busca de /clientes — controla a URL (?q=...) com debounce, para
 * que o Server Component da página refaça a busca sem precisar de uma API
 * route separada. Aceita nome OU telefone digitado livremente (a
 * normalização/combinação dos dois critérios acontece em buscarClientes).
 */
export function ClienteSearch({ valorInicial }: { valorInicial: string }) {
  const [valor, setValor] = useState(valorInicial);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (valor.trim()) {
        params.set("q", valor.trim());
      } else {
        params.delete("q");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
       
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return (
    <div className="relative">
      <input
        type="text"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Buscar por nome ou telefone..."
        className="w-full rounded-xl px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-accent)] transition-colors"
      />
    </div>
  );
}
