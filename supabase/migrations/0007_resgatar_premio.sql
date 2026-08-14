-- ============================================================================
-- resgatar_premio: RPC que grava o resgate (tabela resgates) e desconta
-- compras_para_premio de clientes.pontos, na mesma transação — mesmo padrão
-- de atomicidade das RPCs de compra (0004/0006).
--
-- Diferente delas, aqui a checagem "tem pontos suficientes?" e o desconto
-- são separados por uma leitura no meio (select pontos, depois update). Isso
-- é seguro mesmo com 2 resgates concorrentes para o mesmo cliente: a
-- constraint `pontos_nao_negativo` (migração 0001) garante que, se os dois
-- passarem pela checagem inicial mas só um puder de fato ser descontado sem
-- ficar negativo, o segundo falha com erro de constraint e a transação
-- inteira dele desfaz (não fica um resgate "fantasma" gravado sem o
-- desconto correspondente).
-- ============================================================================

create or replace function public.resgatar_premio(p_cliente_id uuid)
returns table (
  pontos integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estabelecimento_id uuid;
  v_pontos_atual integer;
  v_compras_para_premio integer;
begin
  select estabelecimento_id, pontos into v_estabelecimento_id, v_pontos_atual
  from public.clientes
  where id = p_cliente_id;

  if v_estabelecimento_id is null or v_estabelecimento_id <> public.estabelecimento_do_usuario_atual() then
    raise exception 'Cliente não encontrado.';
  end if;

  select compras_para_premio into v_compras_para_premio
  from public.configuracao_fidelidade
  where estabelecimento_id = v_estabelecimento_id;

  if v_pontos_atual < v_compras_para_premio then
    raise exception 'Pontos insuficientes para resgatar o prêmio.';
  end if;

  insert into public.resgates (cliente_id, estabelecimento_id, pontos_utilizados)
  values (p_cliente_id, v_estabelecimento_id, v_compras_para_premio);

  -- Não zera o saldo: pontos excedentes continuam valendo para o próximo
  -- ciclo (ex.: cliente com 12 pontos resgata e fica com 2, não com 0) —
  -- ver arquitetura, "Resgate de prêmio".
  return query
  update public.clientes c
  set pontos = c.pontos - v_compras_para_premio
  where c.id = p_cliente_id
  returning c.pontos;
end;
$$;

comment on function public.resgatar_premio is
  'Resgata o prêmio do cliente: grava em resgates e desconta compras_para_premio de clientes.pontos (sem zerar). Valida pontos suficientes e que o cliente pertence ao estabelecimento do usuário autenticado.';

revoke all on function public.resgatar_premio from public;
revoke execute on function public.resgatar_premio from anon;
grant execute on function public.resgatar_premio to authenticated;
