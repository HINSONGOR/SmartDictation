import type { ContentLanguage } from "@/lib/database.types";
import { isMissingSchema } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

export type LoadResult<T> =
  | { status: "ready"; data: T }
  | { status: "missing" }
  | { status: "error" };

async function schemaStatus(code: string | undefined): Promise<"missing" | "error" | null> {
  if (!code) {
    return null;
  }

  return isMissingSchema(code) ? "missing" : "error";
}

export async function listLessons(
  language: ContentLanguage,
): Promise<LoadResult<{ id: string; title: string; paragraphCount: number }[]>> {
  const supabase = await createClient();
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("id, title, updated_at")
    .eq("language", language)
    .order("updated_at", { ascending: false });

  const status = await schemaStatus(error?.code);
  if (status) {
    return { status };
  }

  if (error || !lessons) {
    return { status: "error" };
  }

  const ids = lessons.map((lesson) => lesson.id);
  const counts = new Map<string, number>();

  if (ids.length > 0) {
    const { data: paragraphs, error: paragraphError } = await supabase
      .from("paragraphs")
      .select("lesson_id")
      .in("lesson_id", ids);

    if (paragraphError) {
      return { status: "error" };
    }

    for (const paragraph of paragraphs ?? []) {
      counts.set(paragraph.lesson_id, (counts.get(paragraph.lesson_id) ?? 0) + 1);
    }
  }

  return {
    status: "ready",
    data: lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      paragraphCount: counts.get(lesson.id) ?? 0,
    })),
  };
}

export async function getLesson(lessonId: string, language: ContentLanguage): Promise<
  LoadResult<{
    id: string;
    title: string;
    paragraphs: { id: string; content: string }[];
  } | null>
> {
  const supabase = await createClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id, title")
    .eq("id", lessonId)
    .eq("language", language)
    .maybeSingle();

  const status = await schemaStatus(error?.code);
  if (status) {
    return { status };
  }

  if (error) {
    return { status: "error" };
  }

  if (!lesson) {
    return { status: "ready", data: null };
  }

  const { data: paragraphs, error: paragraphError } = await supabase
    .from("paragraphs")
    .select("id, content, sort_order")
    .eq("lesson_id", lessonId)
    .order("sort_order", { ascending: true });

  if (paragraphError || !paragraphs) {
    return { status: "error" };
  }

  return {
    status: "ready",
    data: {
      id: lesson.id,
      title: lesson.title,
      paragraphs: paragraphs.map((paragraph) => ({
        id: paragraph.id,
        content: paragraph.content,
      })),
    },
  };
}

export async function listWordLists(
  language: ContentLanguage,
): Promise<LoadResult<{ id: string; title: string; itemCount: number }[]>> {
  const supabase = await createClient();
  const { data: lists, error } = await supabase
    .from("word_lists")
    .select("id, title, updated_at")
    .eq("language", language)
    .order("updated_at", { ascending: false });

  const status = await schemaStatus(error?.code);
  if (status) {
    return { status };
  }

  if (error || !lists) {
    return { status: "error" };
  }

  const ids = lists.map((list) => list.id);
  const counts = new Map<string, number>();

  if (ids.length > 0) {
    const { data: items, error: itemError } = await supabase
      .from("dictation_items")
      .select("word_list_id")
      .in("word_list_id", ids);

    if (itemError) {
      return { status: "error" };
    }

    for (const item of items ?? []) {
      counts.set(item.word_list_id, (counts.get(item.word_list_id) ?? 0) + 1);
    }
  }

  return {
    status: "ready",
    data: lists.map((list) => ({
      id: list.id,
      title: list.title,
      itemCount: counts.get(list.id) ?? 0,
    })),
  };
}

export async function getWordList(
  listId: string,
  language: ContentLanguage,
): Promise<
  LoadResult<{
    id: string;
    title: string;
    items: { id: string; text: string }[];
  } | null>
> {
  const supabase = await createClient();
  const { data: list, error } = await supabase
    .from("word_lists")
    .select("id, title")
    .eq("id", listId)
    .eq("language", language)
    .maybeSingle();

  const status = await schemaStatus(error?.code);
  if (status) {
    return { status };
  }

  if (error) {
    return { status: "error" };
  }

  if (!list) {
    return { status: "ready", data: null };
  }

  const { data: items, error: itemError } = await supabase
    .from("dictation_items")
    .select("id, text, sort_order")
    .eq("word_list_id", listId)
    .order("sort_order", { ascending: true });

  if (itemError || !items) {
    return { status: "error" };
  }

  return {
    status: "ready",
    data: {
      id: list.id,
      title: list.title,
      items: items.map((item) => ({ id: item.id, text: item.text })),
    },
  };
}
