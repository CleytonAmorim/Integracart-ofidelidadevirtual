import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isRotaProtegida = path.startsWith("/dashboard") || path.startsWith("/clientes") || path.startsWith("/configuracoes");
  const isLogin = path.startsWith("/login");

  if (!user && isRotaProtegida) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isLogin) {
    const url = request.nextUrl.clone();
    // /clientes, não /dashboard — mesmo racional do redirect pós-login em
    // lib/actions/auth.ts (ver comentário lá).
    url.pathname = "/clientes";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
