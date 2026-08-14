-- ============================================================================
-- Dados do estabelecimento piloto: Sorveteria Frio a Frio.
-- Paleta extraída da logo real do cliente (ver arquitetura-mvp.md).
-- Roda automaticamente em `supabase db reset`; pode ser executado manualmente
-- no SQL Editor do Supabase depois de aplicar 0001_init.sql.
-- ============================================================================

insert into public.estabelecimentos (id, nome, cor_primaria, cor_destaque, logo_url)
values (
  '11111111-1111-1111-1111-111111111111',
  'Frio a Frio',
  '#520C89',
  '#FC6FD3',
  null
)
on conflict (id) do nothing;

insert into public.configuracao_fidelidade (
  estabelecimento_id,
  pontos_por_compra,
  compras_para_premio,
  descricao_premio,
  compras_para_desconto,
  desconto_descricao,
  dias_para_atencao,
  dias_para_inativo
)
values (
  '11111111-1111-1111-1111-111111111111',
  1,
  10,
  '1 sorvete grande grátis',
  5,
  '10% de desconto na próxima compra',
  30,
  60
)
on conflict (estabelecimento_id) do nothing;

-- O usuário de login (atendente/dono) NÃO é criado aqui: senhas precisam
-- passar pela API de Auth da Supabase para serem geradas/hasheadas
-- corretamente. Depois de criar o usuário (painel Authentication > Users,
-- ou supabase.auth.admin.createUser), rode isto para vincular ao
-- estabelecimento — troque o UUID pelo id do usuário criado:
--
-- insert into public.usuarios_estabelecimento (id, estabelecimento_id, nome)
-- values ('<uuid-do-usuario-criado>', '11111111-1111-1111-1111-111111111111', 'Nome do atendente');
