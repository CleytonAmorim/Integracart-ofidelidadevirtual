-- ============================================================================
-- Correções apontadas pelo linter de segurança do Supabase (get_advisors),
-- aplicadas logo após a migração inicial (0001_init):
--
-- 1) estabelecimento_do_usuario_atual() é um helper INTERNO de RLS — não deve
--    ser chamável via RPC pública. Por padrão, toda função nova recebe EXECUTE
--    para o pseudo-role PUBLIC (que inclui anon e authenticated) a menos que
--    seja revogado explicitamente. A policy de RLS continua funcionando: o
--    papel `authenticated` mantém EXECUTE (precisa, pois a policy roda no
--    contexto de quem fez a query); `anon` não precisa e não deve ter, já
--    que a única porta pública é buscar_cliente_publico.
-- 2) pg_trgm instalada no schema public é um alerta padrão do linter —
--    mover para o schema `extensions` (convenção do Supabase) é só higiene,
--    não quebra o índice gin já criado (índice referencia a operator class
--    por OID interno, não pelo nome/schema).
-- ============================================================================

revoke all on function public.estabelecimento_do_usuario_atual from public;
grant execute on function public.estabelecimento_do_usuario_atual to authenticated;

create schema if not exists extensions;
alter extension pg_trgm set schema extensions;
