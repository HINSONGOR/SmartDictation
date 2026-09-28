-- Typing answers. Incomplete sessions stay completed = false.
-- Paste this file's contents into the Supabase SQL Editor. Do not run the file path.

create table if not exists public.dictation_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.dictation_sessions (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  item_index integer not null check (item_index >= 0),
  standard_answer text not null,
  student_answer text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  unique (session_id, item_index)
);

create index if not exists dictation_answers_session_id_idx on public.dictation_answers (session_id);

alter table public.dictation_answers enable row level security;

drop policy if exists "Users manage own dictation answers" on public.dictation_answers;
create policy "Users manage own dictation answers"
  on public.dictation_answers
  for all
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.dictation_sessions
      where dictation_sessions.id = session_id
        and dictation_sessions.owner_id = (select auth.uid())
    )
  );

revoke all on table public.dictation_answers from public, anon;
grant select, insert, update, delete on table public.dictation_answers to authenticated;
