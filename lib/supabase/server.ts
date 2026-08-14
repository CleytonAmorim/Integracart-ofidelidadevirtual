import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Client Supabase para uso em Server Components, Server Actions e Route Handlers.
 * Sempre criar uma instância nova por request — nunca reaproveitar entre requests.
 *
 * `setAll` pode falhar aqui dentro de um Server Component puro (que não pode
 * escrever cookies) — isso é esperado e inofensivo: o proxy.ts é quem garante
 * que a sessão é atualizada e escrita de volta na resposta.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Chamado de dentro de um Server Component sem permissão de escrita.
            // Sem problema: o proxy.ts (session refresh) cobre esse caso.
          }
        },
      },
    },
  );
}
