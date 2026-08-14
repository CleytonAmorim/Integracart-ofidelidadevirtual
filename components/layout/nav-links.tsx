"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  /** Rótulo mais curto para caber nas abas do rodapé no celular. */
  labelAbas: string;
  icone: string;
};

const ITENS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", labelAbas: "Início", icone: "▣" },
  { href: "/clientes", label: "Clientes", labelAbas: "Clientes", icone: "☰" },
  { href: "/configuracoes", label: "Configurações", labelAbas: "Ajustes", icone: "⚙" },
];

// "/clientes" também deve ficar ativo em "/clientes/[id]" (perfil do
// cliente) — daí startsWith em vez de igualdade exata; "/dashboard" usa
// igualdade porque senão ficaria sempre ativo (prefixo de tudo depois do "/").
function estaAtivo(pathname: string, href: string): boolean {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

/**
 * Navegação do painel autenticado — um único componente, duas apresentações
 * escolhidas por breakpoint (não por JS): barra lateral no desktop (como já
 * era) e abas fixas no rodapé no celular, convenção nativa de app que
 * resolve o pedido do usuário de "parecer com um app e não com um site" no
 * celular — onde o atendente realmente usa o painel (ver AppLayout, que
 * troca a barra lateral fixa por essas abas + um cabeçalho compacto abaixo
 * de `md`). Cada variante já vem com o próprio `<nav>` fixo/estático, então
 * quem usa só escolhe a `variante` e não precisa posicionar nada por fora.
 */
export function NavLinks({ variante }: { variante: "barraLateral" | "abas" }) {
  const pathname = usePathname();

  if (variante === "abas") {
    return (
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 flex bg-[var(--surface-1)]/95 backdrop-blur-lg border-t border-[var(--border)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {ITENS.map((item) => {
          const ativo = estaAtivo(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
              style={{ color: ativo ? "var(--brand-accent)" : "var(--text-muted)" }}
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {item.icone}
              </span>
              {item.labelAbas}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1 text-sm">
      {ITENS.map((item) => {
        const ativo = estaAtivo(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-2 transition-colors hover:bg-[var(--surface-2)]"
            style={{
              color: ativo ? "var(--text-primary)" : "var(--text-secondary)",
              background: ativo ? "var(--surface-2)" : undefined,
            }}
          >
            {item.icone} {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
