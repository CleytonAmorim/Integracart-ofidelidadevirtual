-- ============================================================================
-- Cartão Fidelidade Digital — schema inicial (MVP, piloto: Sorveteria Frio a Frio)
-- Ver claude/arquitetura-mvp.md (projeto "Cartão Fidelidade Digital") para o
-- desenho completo e o racional de cada decisão.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- estabelecimentos
-- ---------------------------------------------------------------------------
create table public.estabelecimentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cor_primaria text not null default '#520C89',
  cor_destaque text not null default '#FC6FD3',
  logo_url text,
  criado_em timestamptz not null default now()
);

comment on table public.estabelecimentos is 'Cada linha é um negócio cliente da plataforma (multi-tenant desde o início, mesmo com 1 só no piloto).';

-- ---------------------------------------------------------------------------
-- usuarios_estabelecimento
-- ---------------------------------------------------------------------------
-- id = auth.users.id: cada usuário autenticado pertence a exatamente um estabelecimento.
create table public.usuarios_estabelecimento (
  id uuid primary key references auth.users (id) on delete cascade,
  estabelecimento_id uuid not null references public.estabelecimentos (id) on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now()
);

create index usuarios_estabelecimento_estabelecimento_id_idx on public.usuarios_estabelecimento (estabelecimento_id);

-- ---------------------------------------------------------------------------
-- clientes
-- ---------------------------------------------------------------------------
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos (id) on delete cascade,
  nome text not null,
  -- Telefone NÃO é único (ver nota na arquitetura): mais de uma pessoa pode
  -- compartilhar o mesmo celular (ex.: pai e filha). É só um índice de busca.
  telefone text not null,
  pontos integer not null default 0,
  total_gasto numeric(10, 2) not null default 0,
  ultima_compra_em timestamptz,
  -- Token público não-sequencial: chave de acesso da página pública do cliente
  -- (/c/[token]) e do QR code lido pelo atendente. Não muda quando o cliente
  -- edita nome/telefone.
  token_publico uuid not null default gen_random_uuid() unique,
  criado_em timestamptz not null default now(),

  constraint pontos_nao_negativo check (pontos >= 0),
  constraint total_gasto_nao_negativo check (total_gasto >= 0)
);

create index clientes_estabelecimento_id_idx on public.clientes (estabelecimento_id);
create index clientes_telefone_idx on public.clientes (estabelecimento_id, telefone);
create index clientes_nome_idx on public.clientes using gin (nome gin_trgm_ops);
create index clientes_token_publico_idx on public.clientes (token_publico);

comment on column public.clientes.telefone is 'Índice de busca, não é UNIQUE — ver nota "telefone não é identificador único" na arquitetura.';
comment on column public.clientes.token_publico is 'UUID não-adivinhável: chave da página pública (/c/[token]) e do QR code do cliente.';

-- ---------------------------------------------------------------------------
-- compras
-- ---------------------------------------------------------------------------
create table public.compras (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  -- Redundante de propósito (facilita RLS e queries sem precisar de join).
  estabelecimento_id uuid not null references public.estabelecimentos (id) on delete cascade,
  valor numeric(10, 2) not null,
  pontos_gerados integer not null default 1,
  criado_em timestamptz not null default now(),

  constraint valor_positivo check (valor > 0)
);

create index compras_cliente_id_idx on public.compras (cliente_id, criado_em desc);
create index compras_estabelecimento_id_idx on public.compras (estabelecimento_id);

-- ---------------------------------------------------------------------------
-- configuracao_fidelidade (1 linha por estabelecimento)
-- ---------------------------------------------------------------------------
create table public.configuracao_fidelidade (
  estabelecimento_id uuid primary key references public.estabelecimentos (id) on delete cascade,
  pontos_por_compra integer not null default 1,
  compras_para_premio integer not null default 10,
  descricao_premio text not null default '1 prêmio grátis',
  compras_para_desconto integer not null default 5,
  desconto_descricao text not null default '10% de desconto na próxima compra',
  dias_para_atencao integer not null default 30,
  dias_para_inativo integer not null default 60
);

-- ---------------------------------------------------------------------------
-- resgates
-- ---------------------------------------------------------------------------
create table public.resgates (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  estabelecimento_id uuid not null references public.estabelecimentos (id) on delete cascade,
  pontos_utilizados integer not null,
  criado_em timestamptz not null default now()
);

create index resgates_cliente_id_idx on public.resgates (cliente_id);
create index resgates_estabelecimento_id_idx on public.resgates (estabelecimento_id);

-- ---------------------------------------------------------------------------
-- extensão para busca por nome (ILIKE/trigram) — usada no índice de clientes.nome
-- ---------------------------------------------------------------------------
create extension if not exists pg_trgm;

-- ============================================================================
-- Row Level Security — modelo multi-tenant: cada usuário só enxerga/mexe nos
-- dados do próprio estabelecimento (via usuarios_estabelecimento).
-- ============================================================================

create or replace function public.estabelecimento_do_usuario_atual()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select estabelecimento_id
  from public.usuarios_estabelecimento
  where id = auth.uid()
$$;

comment on function public.estabelecimento_do_usuario_atual is 'Helper de RLS: retorna o estabelecimento_id do usuário autenticado, ou null se não estiver logado / não pertencer a nenhum estabelecimento.';

alter table public.estabelecimentos enable row level security;
alter table public.usuarios_estabelecimento enable row level security;
alter table public.clientes enable row level security;
alter table public.compras enable row level security;
alter table public.configuracao_fidelidade enable row level security;
alter table public.resgates enable row level security;

-- estabelecimentos: cada usuário só vê o próprio estabelecimento
create policy "select proprio estabelecimento" on public.estabelecimentos
  for select using (id = public.estabelecimento_do_usuario_atual());

create policy "update proprio estabelecimento" on public.estabelecimentos
  for update using (id = public.estabelecimento_do_usuario_atual());

-- usuarios_estabelecimento: cada usuário só vê colegas do mesmo estabelecimento
create policy "select colegas do mesmo estabelecimento" on public.usuarios_estabelecimento
  for select using (estabelecimento_id = public.estabelecimento_do_usuario_atual());

-- clientes: CRUD restrito ao próprio estabelecimento
create policy "select clientes do proprio estabelecimento" on public.clientes
  for select using (estabelecimento_id = public.estabelecimento_do_usuario_atual());

create policy "insert clientes no proprio estabelecimento" on public.clientes
  for insert with check (estabelecimento_id = public.estabelecimento_do_usuario_atual());

create policy "update clientes do proprio estabelecimento" on public.clientes
  for update using (estabelecimento_id = public.estabelecimento_do_usuario_atual());

-- Sem policy de DELETE em clientes: apagar cadastro de cliente é uma ação
-- destrutiva fora do escopo do MVP (não há botão pra isso na UI).

-- compras: CRUD restrito ao próprio estabelecimento
create policy "select compras do proprio estabelecimento" on public.compras
  for select using (estabelecimento_id = public.estabelecimento_do_usuario_atual());

create policy "insert compras no proprio estabelecimento" on public.compras
  for insert with check (estabelecimento_id = public.estabelecimento_do_usuario_atual());

create policy "update compras do proprio estabelecimento" on public.compras
  for update using (estabelecimento_id = public.estabelecimento_do_usuario_atual());

create policy "delete compras do proprio estabelecimento" on public.compras
  for delete using (estabelecimento_id = public.estabelecimento_do_usuario_atual());

-- configuracao_fidelidade: leitura/edição restrita ao próprio estabelecimento
create policy "select config do proprio estabelecimento" on public.configuracao_fidelidade
  for select using (estabelecimento_id = public.estabelecimento_do_usuario_atual());

create policy "update config do proprio estabelecimento" on public.configuracao_fidelidade
  for update using (estabelecimento_id = public.estabelecimento_do_usuario_atual());

-- resgates: leitura/criação restrita ao próprio estabelecimento (sem update/delete —
-- resgate é um registro histórico, não deve ser alterado)
create policy "select resgates do proprio estabelecimento" on public.resgates
  for select using (estabelecimento_id = public.estabelecimento_do_usuario_atual());

create policy "insert resgates no proprio estabelecimento" on public.resgates
  for insert with check (estabelecimento_id = public.estabelecimento_do_usuario_atual());

-- ============================================================================
-- Acesso público à página do cliente (/c/[token]) — sem login.
--
-- IMPORTANTE: NÃO existe policy de SELECT para a role `anon` na tabela
-- `clientes` (nem em `configuracao_fidelidade`/`estabelecimentos`) — isso é
-- deliberado. Se déssemos `using (true)` numa policy de RLS, qualquer pessoa
-- com a anon key conseguiria listar TODOS os clientes de TODOS os
-- estabelecimentos (RLS não filtra por "a query já tem um WHERE" — só
-- restringe quais linhas existem para aquela role, independente da query).
--
-- Em vez disso, a página pública passa pela função abaixo: uma RPC
-- `security definer` que recebe o token e devolve só os campos necessários
-- para 1 cliente — nunca a tabela inteira. Segurança vem do token_publico
-- ser um UUID não-adivinhável, e do fato de que essa é a ÚNICA porta de
-- entrada que a role anon tem para esses dados.
-- ============================================================================

create or replace function public.buscar_cliente_publico(p_token uuid)
returns table (
  nome text,
  pontos integer,
  criado_em timestamptz,
  cor_primaria text,
  cor_destaque text,
  logo_url text,
  compras_para_premio integer,
  descricao_premio text,
  compras_para_desconto integer,
  desconto_descricao text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.nome,
    c.pontos,
    c.criado_em,
    e.cor_primaria,
    e.cor_destaque,
    e.logo_url,
    cf.compras_para_premio,
    cf.descricao_premio,
    cf.compras_para_desconto,
    cf.desconto_descricao
  from public.clientes c
  join public.estabelecimentos e on e.id = c.estabelecimento_id
  join public.configuracao_fidelidade cf on cf.estabelecimento_id = c.estabelecimento_id
  where c.token_publico = p_token
$$;

comment on function public.buscar_cliente_publico is
  'Única porta de entrada pública (role anon) para dados de cliente — usada pela página /c/[token]. Devolve só nome/pontos/tema/regras, nunca telefone, total_gasto ou histórico. Ver "Página pública do cliente" na arquitetura.';

revoke all on function public.buscar_cliente_publico from public;
grant execute on function public.buscar_cliente_publico to anon, authenticated;
