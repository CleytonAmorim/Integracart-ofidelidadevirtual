import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// No Next.js 16, "middleware.ts" foi renomeado para "proxy.ts" (mesma função,
// export diferente). Ver node_modules/next/dist/docs/.../proxy.md.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas exceto arquivos estáticos, imagens e a rota
     * pública /c/[token] (página do cliente, sem autenticação — não precisa
     * de refresh de sessão do estabelecimento).
     */
    "/((?!_next/static|_next/image|favicon.ico|c/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
