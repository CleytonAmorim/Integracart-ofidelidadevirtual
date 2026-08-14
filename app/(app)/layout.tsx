import { redirect } from "next/navigation";
import Link from "next/link";
import { buscarEstabelecimentoAtual } from "@/lib/actions/estabelecimento";
import { logout } from "@/lib/actions/auth";

// Layout de grupo de rotas — (app) não tem URL própria (é só organização),
// então não existe um único "/rota" para tipar via LayoutProps<'/rota'>: esse
// helper é gerado por rota real, e um layout de grupo cobre várias ao mesmo
// tempo (/dashboard, /clientes, /clientes/[id], /configuracoes). Por isso
// `children` é tipado diretamente aqui, e não via LayoutProps.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const estabelecimento = await buscarEstabelecimentoAtual();

  // Defensivo: o proxy.ts já protege essas rotas, mas se o usuário autenticado
  // não tiver vínculo com nenhum estabelecimento (estado inconsistente), não
  // faz sentido renderizar o painel.
  if (!estabelecimento) {
    redirect("/login");
  }

  // Injeta as CSS custom properties do tema (geradas a partir das 2 cores do
  // estabelecimento) como atributo style — React não aceita uma string crua
  // de CSS em `style`, só um objeto de propriedades, daí o parse abaixo.
  const temaStyle = Object.fromEntries(
    estabelecimento.temaCss.split(";").map((par) => {
      const [chave, valor] = par.split(":").map((s) => s.trim());
      return [chave, valor];
    }),
  );

  return (
    <div style={temaStyle as React.CSSProperties} className="flex-1 flex">
      <aside className="w-60 shrink-0 border-r border-[var(--border)] p-5 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-primary-2))" }}
          >
            🍦
          </div>
          <span className="font-bold text-sm truncate">{estabelecimento.nome}</span>
        </div>

        <nav className="flex flex-col gap-1 text-sm">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors"
          >
            ▣ Dashboard
          </Link>
          <Link
            href="/clientes"
            className="rounded-lg px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors"
          >
            ☰ Clientes
          </Link>
          <Link
            href="/configuracoes"
            className="rounded-lg px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors"
          >
            ⚙ Configurações
          </Link>
        </nav>

        <div className="mt-auto flex flex-col gap-2 text-xs text-[var(--text-muted)]">
          <span>{estabelecimento.nomeUsuario}</span>
          <form action={logout}>
            <button type="submit" className="text-left hover:text-[var(--text-secondary)] transition-colors">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
