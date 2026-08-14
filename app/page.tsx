import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /clientes, não /dashboard — mesmo racional do redirect pós-login em
  // lib/actions/auth.ts (ver comentário lá).
  redirect(user ? "/clientes" : "/login");
}
