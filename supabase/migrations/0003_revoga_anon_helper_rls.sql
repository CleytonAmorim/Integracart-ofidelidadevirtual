-- O Supabase configura "default privileges" no schema public que concedem
-- EXECUTE a anon/authenticated/service_role diretamente em toda função nova
-- (independente do pseudo-role PUBLIC). Por isso a migração anterior
-- (revoke ... from public) não bastou para tirar o acesso de `anon` — havia
-- um grant direto e explícito para o role `anon`, separado do PUBLIC.
--
-- estabelecimento_do_usuario_atual() é um helper interno de RLS: só precisa
-- ser executável por `authenticated` (as próprias policies rodam nesse
-- contexto). `anon` nunca deveria conseguir chamá-la via RPC pública.
revoke execute on function public.estabelecimento_do_usuario_atual from anon;
