-- Stage 2: lessons, paragraphs, word lists, and dictation items.
-- Paste this file's contents into the Supabase SQL Editor. Do not run the file path.

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  title text not null,
  language text not null default 'zh' check (language = 'zh'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.paragraphs (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  sort_order integer not null check (sort_order > 0),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, sort_order)
);

create table if not exists public.word_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  title text not null,
  language text not null check (language in ('zh', 'en')),
  type text not null check (type in ('chinese_vocabulary', 'english_vocabulary')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (language = 'zh' and type = 'chinese_vocabulary')
    or (language = 'en' and type = 'english_vocabulary')
  )
);

create table if not exists public.dictation_items (
  id uuid primary key default gen_random_uuid(),
  word_list_id uuid not null references public.word_lists (id) on delete cascade,
  text text not null,
  sort_order integer not null check (sort_order > 0),
  created_at timestamptz not null default now(),
  unique (word_list_id, sort_order)
);

create index if not exists lessons_owner_id_idx on public.lessons (owner_id);
create index if not exists paragraphs_lesson_id_idx on public.paragraphs (lesson_id);
create index if not exists word_lists_owner_id_idx on public.word_lists (owner_id);
create index if not exists dictation_items_word_list_id_idx on public.dictation_items (word_list_id);

drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

drop trigger if exists paragraphs_set_updated_at on public.paragraphs;
create trigger paragraphs_set_updated_at
  before update on public.paragraphs
  for each row execute function public.set_updated_at();

drop trigger if exists word_lists_set_updated_at on public.word_lists;
create trigger word_lists_set_updated_at
  before update on public.word_lists
  for each row execute function public.set_updated_at();

create or replace function public.owned_student_id()
returns uuid
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  student uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select id
  into student
  from public.students
  where owner_id = auth.uid()
  order by created_at
  limit 1;

  if student is null then
    raise exception 'student missing';
  end if;

  return student;
end;
$$;

create or replace function public.create_lesson(p_title text, p_paragraphs jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  lesson_id uuid;
  rec record;
  paragraph_text text;
  idx integer := 0;
begin
  p_title := trim(coalesce(p_title, ''));
  if char_length(p_title) < 1 or char_length(p_title) > 80 then
    raise exception 'invalid title';
  end if;

  if jsonb_typeof(p_paragraphs) <> 'array'
    or jsonb_array_length(p_paragraphs) < 1
    or jsonb_array_length(p_paragraphs) > 30 then
    raise exception 'invalid paragraphs';
  end if;

  insert into public.lessons (owner_id, student_id, title, language)
  values (auth.uid(), public.owned_student_id(), p_title, 'zh')
  returning id into lesson_id;

  for rec in select value as elem from jsonb_array_elements(p_paragraphs)
  loop
    idx := idx + 1;
    paragraph_text := trim(coalesce(rec.elem->>'content', ''));
    if char_length(paragraph_text) < 1 or char_length(paragraph_text) > 4000 then
      raise exception 'invalid paragraph';
    end if;

    insert into public.paragraphs (lesson_id, sort_order, content)
    values (lesson_id, idx, paragraph_text);
  end loop;

  return lesson_id;
end;
$$;

create or replace function public.save_lesson(p_lesson_id uuid, p_title text, p_paragraphs jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  rec record;
  paragraph_text text;
  paragraph_id uuid;
  idx integer := 0;
  kept uuid[] := array[]::uuid[];
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  p_title := trim(coalesce(p_title, ''));
  if char_length(p_title) < 1 or char_length(p_title) > 80 then
    raise exception 'invalid title';
  end if;

  if jsonb_typeof(p_paragraphs) <> 'array'
    or jsonb_array_length(p_paragraphs) < 1
    or jsonb_array_length(p_paragraphs) > 30 then
    raise exception 'invalid paragraphs';
  end if;

  update public.lessons
  set title = p_title
  where id = p_lesson_id
    and owner_id = auth.uid();

  if not found then
    raise exception 'lesson not found';
  end if;

  update public.paragraphs
  set sort_order = sort_order + 100000
  where lesson_id = p_lesson_id;

  for rec in select value as elem from jsonb_array_elements(p_paragraphs)
  loop
    idx := idx + 1;
    paragraph_text := trim(coalesce(rec.elem->>'content', ''));
    if char_length(paragraph_text) < 1 or char_length(paragraph_text) > 4000 then
      raise exception 'invalid paragraph';
    end if;

    if coalesce(rec.elem->>'id', '') <> '' then
      paragraph_id := (rec.elem->>'id')::uuid;
      update public.paragraphs
      set content = paragraph_text,
          sort_order = idx
      where id = paragraph_id
        and lesson_id = p_lesson_id;

      if not found then
        raise exception 'paragraph not found';
      end if;
    else
      insert into public.paragraphs (lesson_id, sort_order, content)
      values (p_lesson_id, idx, paragraph_text)
      returning id into paragraph_id;
    end if;

    kept := array_append(kept, paragraph_id);
  end loop;

  delete from public.paragraphs
  where lesson_id = p_lesson_id
    and not (id = any (kept));
end;
$$;

create or replace function public.create_word_list(
  p_title text,
  p_language text,
  p_type text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  list_id uuid;
  rec record;
  item_text text;
  idx integer := 0;
begin
  p_title := trim(coalesce(p_title, ''));
  if char_length(p_title) < 1 or char_length(p_title) > 80 then
    raise exception 'invalid title';
  end if;

  if not (
    (p_language = 'zh' and p_type = 'chinese_vocabulary')
    or (p_language = 'en' and p_type = 'english_vocabulary')
  ) then
    raise exception 'invalid word list type';
  end if;

  if jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) < 1
    or jsonb_array_length(p_items) > 200 then
    raise exception 'invalid items';
  end if;

  insert into public.word_lists (owner_id, student_id, title, language, type)
  values (auth.uid(), public.owned_student_id(), p_title, p_language, p_type)
  returning id into list_id;

  for rec in select value as elem from jsonb_array_elements(p_items)
  loop
    idx := idx + 1;
    item_text := trim(coalesce(rec.elem->>'text', ''));
    if char_length(item_text) < 1 or char_length(item_text) > 80 then
      raise exception 'invalid item';
    end if;

    insert into public.dictation_items (word_list_id, text, sort_order)
    values (list_id, item_text, idx);
  end loop;

  return list_id;
end;
$$;

create or replace function public.save_word_list(p_word_list_id uuid, p_title text, p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  rec record;
  item_text text;
  item_id uuid;
  idx integer := 0;
  kept uuid[] := array[]::uuid[];
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  p_title := trim(coalesce(p_title, ''));
  if char_length(p_title) < 1 or char_length(p_title) > 80 then
    raise exception 'invalid title';
  end if;

  if jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) < 1
    or jsonb_array_length(p_items) > 200 then
    raise exception 'invalid items';
  end if;

  update public.word_lists
  set title = p_title
  where id = p_word_list_id
    and owner_id = auth.uid();

  if not found then
    raise exception 'word list not found';
  end if;

  update public.dictation_items
  set sort_order = sort_order + 100000
  where word_list_id = p_word_list_id;

  for rec in select value as elem from jsonb_array_elements(p_items)
  loop
    idx := idx + 1;
    item_text := trim(coalesce(rec.elem->>'text', ''));
    if char_length(item_text) < 1 or char_length(item_text) > 80 then
      raise exception 'invalid item';
    end if;

    if coalesce(rec.elem->>'id', '') <> '' then
      item_id := (rec.elem->>'id')::uuid;
      update public.dictation_items
      set text = item_text,
          sort_order = idx
      where id = item_id
        and word_list_id = p_word_list_id;

      if not found then
        raise exception 'item not found';
      end if;
    else
      insert into public.dictation_items (word_list_id, text, sort_order)
      values (p_word_list_id, item_text, idx)
      returning id into item_id;
    end if;

    kept := array_append(kept, item_id);
  end loop;

  delete from public.dictation_items
  where word_list_id = p_word_list_id
    and not (id = any (kept));
end;
$$;

revoke all on function public.owned_student_id() from public, anon;
grant execute on function public.owned_student_id() to authenticated;
revoke all on function public.create_lesson(text, jsonb) from public, anon;
revoke all on function public.save_lesson(uuid, text, jsonb) from public, anon;
revoke all on function public.create_word_list(text, text, text, jsonb) from public, anon;
revoke all on function public.save_word_list(uuid, text, jsonb) from public, anon;

grant execute on function public.create_lesson(text, jsonb) to authenticated;
grant execute on function public.save_lesson(uuid, text, jsonb) to authenticated;
grant execute on function public.create_word_list(text, text, text, jsonb) to authenticated;
grant execute on function public.save_word_list(uuid, text, jsonb) to authenticated;

alter table public.lessons enable row level security;
alter table public.paragraphs enable row level security;
alter table public.word_lists enable row level security;
alter table public.dictation_items enable row level security;

drop policy if exists "Users manage own lessons" on public.lessons;
create policy "Users manage own lessons"
  on public.lessons
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

drop policy if exists "Users manage paragraphs of own lessons" on public.paragraphs;
create policy "Users manage paragraphs of own lessons"
  on public.paragraphs
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.lessons
      where lessons.id = lesson_id
        and lessons.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.lessons
      where lessons.id = lesson_id
        and lessons.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Users manage own word lists" on public.word_lists;
create policy "Users manage own word lists"
  on public.word_lists
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

drop policy if exists "Users manage items of own word lists" on public.dictation_items;
create policy "Users manage items of own word lists"
  on public.dictation_items
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.word_lists
      where word_lists.id = word_list_id
        and word_lists.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.word_lists
      where word_lists.id = word_list_id
        and word_lists.owner_id = (select auth.uid())
    )
  );

revoke all on table public.lessons from public, anon;
revoke all on table public.paragraphs from public, anon;
revoke all on table public.word_lists from public, anon;
revoke all on table public.dictation_items from public, anon;

grant select, insert, update, delete on table public.lessons to authenticated;
grant select, insert, update, delete on table public.paragraphs to authenticated;
grant select, insert, update, delete on table public.word_lists to authenticated;
grant select, insert, update, delete on table public.dictation_items to authenticated;
