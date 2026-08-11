-- ============================================================
-- 1. TABELA profiles
-- Um perfil por usuário do Supabase Auth (id = auth.users.id).
-- Guarda só o que a aplicação precisa: papel (admin/viewer) e se
-- o acesso está ativo. Nenhuma senha é armazenada aqui — senha é
-- responsabilidade do Supabase Auth (auth.users), nunca desta tabela.
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'viewer',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table profiles
      add constraint profiles_role_check check (role in ('admin', 'viewer'));
  end if;
end $$;

-- ============================================================
-- 2. CRIAÇÃO AUTOMÁTICA DE PERFIL
-- Sempre que alguém se cadastra no Supabase Auth (supabase.auth.signUp,
-- inclusive quando um admin cria outro usuário pela tela do app), esta
-- trigger cria a linha correspondente em profiles com papel 'viewer'
-- por padrão. Um admin promove para 'admin' depois, se for o caso.
-- SECURITY DEFINER: roda com privilégio do dono da função, então
-- funciona mesmo que o cliente que disparou o cadastro não tenha
-- permissão de INSERT direta em profiles (não precisamos dar essa
-- permissão a ninguém no frontend).
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 3. FUNÇÃO AUXILIAR is_admin()
-- Usada dentro das políticas de RLS abaixo. SECURITY DEFINER evita
-- o problema clássico de recursão (uma policy em "profiles" que
-- precisa consultar "profiles" para saber se pode agir).
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

-- ============================================================
-- 4. ROW LEVEL SECURITY em profiles
-- - Qualquer usuário autenticado pode LER todos os perfis (necessário
--   para o app saber seu próprio papel e para a tela de gestão de
--   usuários listar todo mundo). Não expõe senha nenhuma — só
--   email/role/active.
-- - Só admin ativo pode ALTERAR papel/status de qualquer perfil.
-- - Não existe policy de INSERT/DELETE para o cliente: perfis só são
--   criados pela trigger (seção 2) e não há exclusão pelo app.
-- ============================================================

alter table profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_authenticated'
  ) then
    create policy "profiles_select_authenticated"
    on profiles for select
    to authenticated
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_by_admin'
  ) then
    create policy "profiles_update_by_admin"
    on profiles for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());
  end if;
end $$;

-- ============================================================
-- 5. BOOTSTRAP DO MASTER (passo manual, execute por último)
-- ------------------------------------------------------------
-- ANTES de rodar o UPDATE abaixo:
--   1. Vá no painel do Supabase > Authentication > Users > Add User.
--   2. Crie o usuário master com um e-mail e senha fortes (marque
--      "Auto Confirm User" para não depender de e-mail de confirmação).
--   3. A trigger da seção 2 já cria automaticamente uma linha em
--      profiles para ele, com role='viewer'.
--   4. Só então rode o UPDATE abaixo, trocando o e-mail, para promovê-lo
--      a admin (o master temporário que a TI pediu).
-- ============================================================

-- update profiles set role = 'admin' where email = 'SEU_EMAIL_MASTER_AQUI';
