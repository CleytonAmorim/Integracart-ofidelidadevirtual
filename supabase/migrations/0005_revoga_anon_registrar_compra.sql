-- Mesmo caso já visto em 0003 (revoga_anon_helper_rls): o Supabase concede
-- EXECUTE diretamente à role `anon` em toda função nova do schema public,
-- via "default privileges", independente do `revoke all ... from public`
-- que já está na própria migração 0004. Confirmado pelo get_advisors logo
-- após aplicar 0004 (registrar_compra aparecia como executável por `anon`).
--
-- registrar_compra só faz sentido para quem está autenticado (o atendente
-- logado) — cliente final (anon) não deve conseguir registrar compra em
-- nome de ninguém.
revoke execute on function public.registrar_compra(uuid, numeric) from anon;
