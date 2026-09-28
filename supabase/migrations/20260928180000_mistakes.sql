-- Mistakes from typing dictation. A later correct answer marks active = false.
-- Paste this file's contents into the Supabase SQL Editor. Do not run the file path.

create table if not exists public.mistakes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  language text not null check (language in ('zh', 'en')),
  source_type text not null check (source_type in ('lesson', 'word_list')),
  source_id uuid not null,
  answer_key text not null,
  standard_answer text not null,
  student_answer text not null,
  mistake_count integer not null default 1 check (mistake_count > 0),
  active boolean not null default true,
  last_wrong_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (student_id, source_id, answer_key)
);

create index if not exists mistakes_student_active_idx on public.mistakes (student_id, active);

alter table public.dictation_sessions
  add column if not exists mistake_ids uuid[];

alter table public.mistakes enable row level security;

drop policy if exists "Users manage own mistakes" on public.mistakes;
create policy "Users manage own mistakes"
  on public.mistakes
  for all
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.students
      where students.id = student_id
        and students.owner_id = (select auth.uid())
    )
  );

revoke all on table public.mistakes from public, anon;
grant select, insert, update, delete on table public.mistakes to authenticated;
