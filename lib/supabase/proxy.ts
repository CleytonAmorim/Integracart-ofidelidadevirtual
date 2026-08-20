import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { retryUmaVez } from "@/lib/utils/retry";

/**
 * Atualiza a sessão do Supabase a cada request (renova o token quando necessário)
 * e escreve os cookies atualizados de volta na resposta. Usado pelo proxy.ts
 * (equivalente ao antigo middleware.ts no Next.js 16).
 *
 * IMPORTANTE: sempre usar getUser() aqui, nunca getSession() — getUser()
 * revalida o token contra o servidor da Supabase; getSession() só lê o
 * cookie local e pode ser forjado.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    },
  );

  // Revalida o token — necessário mesmo sem usar `user` diretamente aqui,
  // pois é essa chamada que dispara o refresh e a escrita dos novos cookies.
  // retryUmaVez absorve o "JWT issued at future" transitório logo após um
  // login novo (ver lib/utils/retry.ts) — sem isso, derrubava a página com
  // erro 500 (confirmado em produção). Se persistir mesmo com o retry,
  // trata como deslogado (mais seguro que travar a página).
  let user = null;
  try {
    ({
      data: { user },
    } = await retryUmaVez(() => supabase.auth.getUser()));
  } catch {
    user = null;
  }

  const path = request.nextUrl.pathname;
  const isRotaProtegida = path.startsWith("/dashboard") || path.startsWith("/clientes") || path.startsWith("/configuracoes");
  const isLogin = path.startsWith("/login");

  // Redirects criam uma resposta nova — sem copiar os cookies escritos acima
  // em supabaseResponse, o refresh de token dessa request se perde (o
  // navegador nunca recebe o token renovado), o que deixa a sessão
  // inconsistente entre requests e pode gerar loop de redirecionamento
  // /login <-> /clientes.
  function redirectPreservandoSessao(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    // Sem isso, o navegador (ou algum cache intermediário) pode guardar esse
    // redirect e reproduzi-lo depois sem bater no servidor de novo — se a
    // sessão já tiver mudado nesse meio-tempo, isso reproduz sozinho o loop
    // /login <-> /clientes a partir do cache local, mesmo com os cookies OK.
    redirectResponse.headers.set("Cache-Control", "no-store");
    return redirectResponse;
  }

  if (!user && isRotaProtegida) {
    return redirectPreservandoSessao("/login");
  }

  if (user && isLogin) {
    // /clientes, não /dashboard — mesmo racional do redirect pós-login em
    // lib/actions/auth.ts (ver comentário lá).
    return redirectPreservandoSessao("/clientes");
  }

  return supabaseResponse;
}
