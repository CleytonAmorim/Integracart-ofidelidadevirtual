"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  erro?: string;
  sucesso?: boolean;
};

/**
 * Dentro de uma Server Action, redirect() faz uma navegação client-side (não
 * um redirect HTTP) quando JS está disponível (ver node_modules/next/dist/docs
 * — Next 16, seção "redirect"). Isso pode disparar a navegação pra /clientes
 * antes do cookie de sessão recém-criado estar garantidamente salvo no
 * navegador, causando falha logo após o login (mais visível no Safari
 * mobile). Por isso login() não chama redirect() diretamente — devolve
 * `sucesso: true` e quem faz a navegação é o client (login-form.tsx), via
 * window.location, uma navegação completa (não client-side) que só acontece
 * depois da resposta da action (com o Set-Cookie) já ter chegado ao navegador.
 */
export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { erro: "Preencha e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return { erro: "E-mail ou senha incorretos." };
  }

  return { sucesso: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
