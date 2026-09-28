-- English lessons use the same paragraph structure as Chinese lessons.
-- Paste this file's contents into the Supabase SQL Editor. Do not run the file path.

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'lessons'
      and con.contype = 'c'
  loop
    execute format('alter table public.lessons drop constraint %I', constraint_name);
  end loop;
end;
$$;

alter table public.lessons
  add constraint lessons_language_check check (language in ('zh', 'en'));

drop function if exists public.create_lesson(text, jsonb);
drop function if exists public.save_lesson(uuid, text, jsonb);

create or replace function public.create_lesson(
  p_language text,
  p_title text,
  p_paragraphs jsonb
)
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
  if p_language not in ('zh', 'en') then
    raise exception 'invalid language';
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

  insert into public.lessons (owner_id, student_id, title, language)
  values (auth.uid(), public.owned_student_id(), p_title, p_language)
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

create or replace function public.save_lesson(
  p_lesson_id uuid,
  p_language text,
  p_title text,
  p_paragraphs jsonb
)
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

  if p_language not in ('zh', 'en') then
    raise exception 'invalid language';
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
    and owner_id = auth.uid()
    and language = p_language;

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

revoke all on function public.create_lesson(text, text, jsonb) from public, anon;
revoke all on function public.save_lesson(uuid, text, text, jsonb) from public, anon;
grant execute on function public.create_lesson(text, text, jsonb) to authenticated;
grant execute on function public.save_lesson(uuid, text, text, jsonb) to authenticated;
