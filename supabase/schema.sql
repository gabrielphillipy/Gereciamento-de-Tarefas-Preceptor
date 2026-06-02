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
  target_team text not null default '',
  meeting_summary text not null default '',
  meeting_goals jsonb not null default '[]'::jsonb,
  recurrence text not null default 'none'
    check (recurrence in ('none', 'diaria', 'semanal', 'mensal')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migração para bancos existentes: adiciona as colunas sem quebrar dados antigos.
alter table public.work_items
  add column if not exists target_team text not null default '',
  add column if not exists meeting_summary text not null default '',
  add column if not exists meeting_goals jsonb not null default '[]'::jsonb,
  add column if not exists recurrence text not null default 'none'
    check (recurrence in ('none', 'diaria', 'semanal', 'mensal'));

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

-- Função auxiliar: verifica se o usuário atual é gestor.
-- SECURITY DEFINER evita recursão de RLS ao consultar profiles de dentro
-- de uma policy aplicada à própria tabela profiles.
create or replace function public.is_gestor()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'gestor'
  );
$$;

-- Perfis: gestor pode atualizar qualquer perfil (promover/rebaixar, editar equipe)
create policy "profiles_gestor_update" on public.profiles
  for update to authenticated
  using (public.is_gestor())
  with check (public.is_gestor());

-- Work items: gestor tem acesso total
create policy "work_items_gestor_all" on public.work_items
  for all to authenticated
  using  ((select role from public.profiles where id = auth.uid()) = 'gestor')
  with check ((select role from public.profiles where id = auth.uid()) = 'gestor');

-- Work items: colaborador lê as próprias demandas, as gerais
-- (sem equipe alvo) e as direcionadas à sua equipe.
drop policy if exists "work_items_colab_select" on public.work_items;
create policy "work_items_colab_select" on public.work_items
  for select to authenticated using (
    owner_id = auth.uid()
    or coalesce(target_team, '') = ''
    or target_team = (select team from public.profiles where id = auth.uid())
  );

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

-- ─── Criação automática de perfil ao cadastrar ──────────────
-- O perfil é criado pelo banco (não pelo cliente), lendo nome e
-- equipe do metadata enviado no signUp. Todo novo usuário entra
-- como 'colaborador'. A primeira conta gestora deve ser promovida
-- manualmente pelo dono do projeto via SQL Editor do Supabase
-- (ver bloco "Bootstrap do primeiro gestor" no final deste arquivo).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, team)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    'colaborador',
    coalesce(new.raw_user_meta_data->>'team', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Realtime ────────────────────────────────────────────────
-- Publica as tabelas para que o app receba mudanças em tempo real.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'work_items'
  ) then
    alter publication supabase_realtime add table public.work_items;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- ─── Proteção de colunas sensíveis ──────────────────────────
-- O RLS controla LINHAS, não COLUNAS. Estes triggers garantem que:
--  • só um gestor altera o campo `role` de um perfil;
--  • colaborador só altera o `status` das próprias demandas.

create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_gestor() then
    raise exception 'Apenas gestores podem alterar o cargo de um usuário.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_update();

create or replace function public.guard_work_item_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_gestor() then
    return new;
  end if;
  if new.title       is distinct from old.title
  or new.owner_id    is distinct from old.owner_id
  or new.kind        is distinct from old.kind
  or new.date        is distinct from old.date
  or new.time        is distinct from old.time
  or new.priority    is distinct from old.priority
  or new.project     is distinct from old.project
  or new.notes       is distinct from old.notes
  or new.target_team is distinct from old.target_team
  or new.recurrence  is distinct from old.recurrence then
    raise exception 'Colaboradores só podem alterar o status da demanda.';
  end if;
  return new;
end;
$$;

drop trigger if exists work_items_guard on public.work_items;
create trigger work_items_guard
  before update on public.work_items
  for each row execute function public.guard_work_item_update();

-- ─── Bootstrap do primeiro gestor ────────────────────────────
-- Todo usuário criado pelo signUp entra como 'colaborador'.
-- Após cadastrar a SUA conta no app, rode UMA VEZ no SQL Editor
-- do Supabase (que usa service_role e ignora RLS) para se promover:
--
--   update public.profiles set role = 'gestor' where email = 'voce@email.com';
--
-- A partir daí, você pode promover outros usuários pela tela de
-- Administração dentro do próprio app.
--
-- ─── Confirmação de e-mail ───────────────────────────────────
-- Em produção, mantenha "Confirm email" ATIVADO em:
--   Supabase Dashboard → Authentication → Providers → Email
-- Sem isso, qualquer e-mail (inclusive inventado) cria conta.
