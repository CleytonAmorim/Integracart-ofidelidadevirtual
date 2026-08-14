-- ============================================================================
-- registrar_compra: RPC que registra uma compra e atualiza
-- pontos/total_gasto/ultima_compra_em do cliente numa única transação.
--
-- Por que uma função em vez de 2 chamadas separadas do supabase-js (insert
-- em compras + update em clientes): "pontos = pontos + x" feito no cliente
-- exigiria ler o valor atual antes de somar, o que é uma condição de corrida
-- real nesse produto (2 atendentes podem registrar compra do mesmo cliente
-- quase ao mesmo tempo no balcão). Fazer os dois passos dentro de uma função
-- do Postgres evita isso.
-- ============================================================================

create or replace function public.registrar_compra(p_cliente_id uuid, p_valor numeric)
returns table (
  pontos integer,
  total_gasto numeric,
  ultima_compra_em timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estabelecimento_id uuid;
  v_pontos_por_compra integer;
begin
  if p_valor is null or p_valor <= 0 then
    raise exception 'Valor da compra deve ser maior que zero.';
  end if;

  select estabelecimento_id into v_estabelecimento_id
  from public.clientes
  where id = p_cliente_id;

  -- Mesma checagem que a RLS faria num insert/update direto — precisa ser
  -- explícita aqui porque a função roda como security definer (ignora RLS).
  if v_estabelecimento_id is null or v_estabelecimento_id <> public.estabelecimento_do_usuario_atual() then
    raise exception 'Cliente não encontrado.';
  end if;

  select pontos_por_compra into v_pontos_por_compra
  from public.configuracao_fidelidade
  where estabelecimento_id = v_estabelecimento_id;

  insert into public.compras (cliente_id, estabelecimento_id, valor, pontos_gerados)
  values (p_cliente_id, v_estabelecimento_id, p_valor, coalesce(v_pontos_por_compra, 1));

  return query
  update public.clientes c
  set
    pontos = c.pontos + coalesce(v_pontos_por_compra, 1),
    total_gasto = c.total_gasto + p_valor,
    ultima_compra_em = now()
  where c.id = p_cliente_id
  returning c.pontos, c.total_gasto, c.ultima_compra_em;
end;
$$;

comment on function public.registrar_compra is
  'Registra uma compra e atualiza pontos/total_gasto/ultima_compra_em do cliente atomicamente. Valida que o cliente pertence ao estabelecimento do usuário autenticado antes de gravar.';

revoke all on function public.registrar_compra from public;
grant execute on function public.registrar_compra to authenticated;
