import { redirect } from "next/navigation";
import { buscarEstabelecimentoAtual } from "@/lib/actions/estabelecimento";
import { logout } from "@/lib/actions/auth";
import { ToastProvider } from "@/components/ui/toast";
import { NavLinks } from "@/components/layout/nav-links";

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

  // Marca do estabelecimento (logo real quando existir — ver "Status" na
  // arquitetura, ainda pendente do usuário mandar o arquivo — com o emoji
  // como fallback) — mesmo elemento reaproveitado no cabeçalho compacto do
  // celular e na barra lateral do desktop, então só precisa existir uma vez.
  // <img> comum em vez de next/image de propósito: logo vinda do Storage do
  // Supabase (domínio ainda não cadastrado em next.config para next/image),
  // e é só um ícone de 36px — não vale a pena o pipeline de otimização aqui.
  const marca = estabelecimento.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={estabelecimento.logoUrl}
      alt=""
      className="w-9 h-9 rounded-xl object-cover shrink-0"
    />
  ) : (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
      style={{ background: "linear-gradient(135deg, var(--brand-primary), var(--brand-primary-2))" }}
    >
      🍦
    </div>
  );

  return (
    <div style={temaStyle as React.CSSProperties} className="flex-1 flex flex-col md:flex-row">
      {/* Cabeçalho compacto — só no celular, substitui a barra lateral (que
          vira as abas do rodapé, ver NavLinks) como identificação do
          estabelecimento + saída. `sticky` gruda no topo da rolagem da
          página (não existe um contêiner de rolagem próprio aqui), reforçando
          a sensação de app em vez de site ao navegar pela lista de clientes. */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-1)]/95 backdrop-blur-lg">
        <div className="flex items-center gap-2 min-w-0">
          {marca}
          <span className="font-bold text-sm truncate">{estabelecimento.nome}</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors shrink-0"
          >
            Sair
          </button>
        </form>
      </header>

      <aside className="hidden md:flex md:w-60 md:shrink-0 md:border-r md:border-[var(--border)] md:p-5 md:flex-col md:gap-6">
        <div className="flex items-center gap-3">
          {marca}
          <span className="font-bold text-sm truncate">{estabelecimento.nome}</span>
        </div>

        <NavLinks variante="barraLateral" />

        <div className="mt-auto flex flex-col gap-2 text-xs text-[var(--text-muted)]">
          <span>{estabelecimento.nomeUsuario}</span>
          <form action={logout}>
            <button type="submit" className="text-left hover:text-[var(--text-secondary)] transition-colors">
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* pb-24 no celular: espaço para o conteúdo não ficar escondido atrás
          das abas fixas do rodapé (ver NavLinks, variante "abas"). */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
        <ToastProvider>{children}</ToastProvider>
      </main>

      <NavLinks variante="abas" />
    </div>
  );
}
