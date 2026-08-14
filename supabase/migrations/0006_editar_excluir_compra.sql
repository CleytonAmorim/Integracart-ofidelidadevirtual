-- ============================================================================
-- editar_valor_compra / excluir_compra: mesma lógica de registrar_compra
-- (migração 0004) — RPCs para manter compras.* e clientes.pontos/total_gasto
-- consistentes numa única transação, em vez de 2+ chamadas separadas do
-- supabase-js com risco de condição de corrida.
--
-- Restrição de negócio (ver arquitetura, "Corrigir uma compra registrada
-- errado"): só é possível editar/excluir compras registradas NO MESMO DIA.
-- Essa checagem é feita AQUI, no banco, e não só na UI — uma restrição de
-- negócio checada só no client não é uma restrição de verdade (dá pra
-- chamar a API direto). "Hoje" é definido no fuso America/Sao_Paulo, não em
-- UTC (o fuso padrão do Postgres no Supabase), senão a trava destrava/tranca
-- na hora errada perto da meia-noite para quem está no Brasil.
--
-- Já revogando EXECUTE de `anon` nesta própria migração (não numa migração
-- de correção separada) — lição das migrações 0003/0005: o Supabase concede
-- EXECUTE por padrão a anon/authenticated em toda função nova do schema
-- public, independente do "revoke ... from public".
-- ============================================================================

create or replace function public.editar_valor_compra(p_compra_id uuid, p_novo_valor numeric)
returns table (
  total_gasto numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estabelecimento_id uuid;
  v_cliente_id uuid;
  v_valor_antigo numeric;
  v_criado_em timestamptz;
begin
  if p_novo_valor is null or p_novo_valor <= 0 then
    raise exception 'Valor da compra deve ser maior que zero.';
  end if;

  select estabelecimento_id, cliente_id, valor, criado_em
    into v_estabelecimento_id, v_cliente_id, v_valor_antigo, v_criado_em
  from public.compras
  where id = p_compra_id;

  if v_estabelecimento_id is null or v_estabelecimento_id <> public.estabelecimento_do_usuario_atual() then
    raise exception 'Compra não encontrada.';
  end if;

  if (v_criado_em at time zone 'America/Sao_Paulo')::date <> (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'Só é possível editar compras registradas hoje.';
  end if;

  update public.compras set valor = p_novo_valor where id = p_compra_id;

  return query
  update public.clientes c
  set total_gasto = greatest(0, c.total_gasto - v_valor_antigo + p_novo_valor)
  where c.id = v_cliente_id
  returning c.total_gasto;
end;
$$;

comment on function public.editar_valor_compra is
  'Edita o valor de uma compra e reflete a diferença em clientes.total_gasto atomicamente. NÃO recalcula pontos_gerados/pontos — a regra de pontos é fixa por compra, não por valor. Só permite compras registradas hoje (fuso America/Sao_Paulo).';

revoke all on function public.editar_valor_compra from public;
revoke execute on function public.editar_valor_compra from anon;
grant execute on function public.editar_valor_compra to authenticated;

create or replace function public.excluir_compra(p_compra_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estabelecimento_id uuid;
  v_cliente_id uuid;
  v_valor numeric;
  v_pontos_gerados integer;
  v_criado_em timestamptz;
  v_ultima_compra_nova timestamptz;
begin
  select estabelecimento_id, cliente_id, valor, pontos_gerados, criado_em
    into v_estabelecimento_id, v_cliente_id, v_valor, v_pontos_gerados, v_criado_em
  from public.compras
  where id = p_compra_id;

  if v_estabelecimento_id is null or v_estabelecimento_id <> public.estabelecimento_do_usuario_atual() then
    raise exception 'Compra não encontrada.';
  end if;

  if (v_criado_em at time zone 'America/Sao_Paulo')::date <> (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'Só é possível excluir compras registradas hoje.';
  end if;

  delete from public.compras where id = p_compra_id;

  -- Se a excluída era a mais recente, ultima_compra_em volta para a compra
  -- anterior (ou fica null se não sobrar nenhuma) — ver arquitetura.
  select max(criado_em) into v_ultima_compra_nova
  from public.compras
  where cliente_id = v_cliente_id;

  update public.clientes c
  set
    pontos = greatest(0, c.pontos - v_pontos_gerados),
    total_gasto = greatest(0, c.total_gasto - v_valor),
    ultima_compra_em = v_ultima_compra_nova
  where c.id = v_cliente_id;
end;
$$;

comment on function public.excluir_compra is
  'Exclui uma compra e desfaz seu efeito em clientes.pontos/total_gasto/ultima_compra_em atomicamente. Só permite compras registradas hoje (fuso America/Sao_Paulo).';

revoke all on function public.excluir_compra from public;
revoke execute on function public.excluir_compra from anon;
grant execute on function public.excluir_compra to authenticated;
