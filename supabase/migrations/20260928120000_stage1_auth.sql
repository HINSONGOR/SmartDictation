-- Stage 1: accounts, profiles, default student, and row level security.
-- Run this in the Supabase SQL Editor for the project used by .env.local.

create or replace function public.profile_display_name(meta jsonb, email text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(meta->>'full_name', ''),
    nullif(meta->>'name', ''),
    nullif(split_part(coalesce(email, ''), '@', 1), ''),
    '學生'
  );
$$;

revoke all on function public.profile_display_name(jsonb, text) from public, anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  theme text,
  voice_zh text not null default 'zh-HK' check (voice_zh in ('zh-HK', 'zh-CN')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists students_owner_id_idx on public.students (owner_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_name text;
begin
  chosen_name := public.profile_display_name(new.raw_user_meta_data, new.email);

  insert into public.profiles (id, display_name)
  values (new.id, chosen_name);

  insert into public.students (owner_id, name)
  values (new.id, chosen_name);

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, display_name)
select u.id, public.profile_display_name(u.raw_user_meta_data, u.email)
from auth.users as u
on conflict (id) do nothing;

insert into public.students (owner_id, name)
select p.id, coalesce(nullif(p.display_name, ''), '學生')
from public.profiles as p
where not exists (
  select 1
  from public.students as s
  where s.owner_id = p.id
);

alter table public.profiles enable row level security;
alter table public.students enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Users manage own students" on public.students;
create policy "Users manage own students"
  on public.students
  for all
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on table public.profiles from public, anon;
revoke all on table public.students from public, anon;
grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.students to authenticated;
