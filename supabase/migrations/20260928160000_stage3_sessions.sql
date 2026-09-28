-- Stage 3: listening sessions. Incomplete sessions are not official scores.
-- Paste this file's contents into the Supabase SQL Editor. Do not run the file path.

create table if not exists public.dictation_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  language text not null check (language in ('zh', 'en')),
  source_type text not null check (source_type in ('lesson', 'paragraph', 'word_list', 'mistakes')),
  source_id uuid not null,
  paragraph_index integer check (paragraph_index is null or paragraph_index > 0),
  mode text not null check (mode in ('listen', 'paper', 'typing')),
  voice text check (voice in ('zh-HK', 'zh-CN', 'en-GB')),
  speed text check (speed in ('0.5', '0.75', '1', '1.25', '1.5')),
  score numeric,
  accuracy numeric,
  correct_count integer,
  wrong_count integer,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists dictation_sessions_owner_id_idx on public.dictation_sessions (owner_id);

alter table public.dictation_sessions enable row level security;

drop policy if exists "Users manage own dictation sessions" on public.dictation_sessions;
create policy "Users manage own dictation sessions"
  on public.dictation_sessions
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

revoke all on table public.dictation_sessions from public, anon;
grant select, insert, update, delete on table public.dictation_sessions to authenticated;
