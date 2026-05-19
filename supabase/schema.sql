-- =============================================================
-- Preceptor Tasks — Schema Supabase
-- Execute no SQL Editor do Supabase Dashboard
-- =============================================================

-- ─── Tabela de perfis ────────────────────────────────────────
create table if not exists public.profiles (
  id     uuid references auth.users(id) on delete cascade primary key,
  name   text not null,
  email  text not null,
  role   text not null check (role in ('gestor', 'colaborador')),
  team   text not null default ''
);

-- ─── Tabela de demandas ──────────────────────────────────────
create table if not exists public.work_items (
  id         bigserial primary key,
  title      text not null,
  owner_id   uuid references public.profiles(id) on delete cascade not null,
  kind       text not null check (kind in ('tarefa', 'reuniao', 'entrega')),
  status     text not null check (status in ('planejada', 'em-andamento', 'revisao', 'concluida')) default 'planejada',
  date       date not null,
  time       text not null,
  priority   text not null check (priority in ('Baixa', 'Media', 'Alta')) default 'Media',
  project    text default '',
  notes      text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Row Level Security ──────────────────────────────────────
alter table public.profiles   enable row level security;
alter table public.work_items enable row level security;

-- Perfis: qualquer usuário autenticado lê todos os perfis (necessário para exibir equipe)
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

-- Perfis: usuário só insere/atualiza o próprio
create policy "profiles_insert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "profiles_update" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- Work items: gestor tem acesso total
create policy "work_items_gestor_all" on public.work_items
  for all to authenticated
  using  ((select role from public.profiles where id = auth.uid()) = 'gestor')
  with check ((select role from public.profiles where id = auth.uid()) = 'gestor');

-- Work items: colaborador lê as próprias demandas
create policy "work_items_colab_select" on public.work_items
  for select to authenticated using (owner_id = auth.uid());

-- Work items: colaborador atualiza status das próprias demandas
create policy "work_items_colab_update" on public.work_items
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ─── Trigger para updated_at automático ─────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger work_items_updated_at
  before update on public.work_items
  for each row execute function public.set_updated_at();

-- ─── NOTA ────────────────────────────────────────────────────
-- Para facilitar testes, desative a confirmação de e-mail em:
-- Supabase Dashboard → Authentication → Providers → Email
-- desmarque "Confirm email"
