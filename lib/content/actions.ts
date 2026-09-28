"use server";

import { redirect } from "next/navigation";
import type { ContentLanguage } from "@/lib/database.types";
import type { ActionState } from "@/lib/content/action-state";
import {
  isUuid,
  paragraphsToJson,
  parseParagraphs,
  parseTitle,
  parseWords,
  wordListKind,
  wordsToJson,
} from "@/lib/content/parse";
import { requireUser } from "@/lib/auth/require-user";
import { isMissingSchema } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

const SAVE_ERROR = "儲存失敗，請再試一次。";
const CONTENT_MIGRATION =
  "supabase/migrations/20260928140000_stage2_content.sql";
const LESSON_MIGRATION =
  "supabase/migrations/20260928150000_english_lessons.sql";

function formError(
  error: { code?: string; message?: string } | null,
  migrationFile = CONTENT_MIGRATION,
): string {
  if (isMissingSchema(error?.code) || error?.message?.includes("Could not find")) {
    return `資料表或儲存功能尚未更新。請在 Supabase SQL Editor 貼上並執行 ${migrationFile} 的內容。`;
  }

  if (error?.message?.includes("student missing")) {
    return "尚未有學生資料。請先確認登入帳號已建立學生。";
  }

  return SAVE_ERROR;
}

export async function saveLessonAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const title = parseTitle(formData.get("title"));
  const paragraphs = parseParagraphs(formData.get("paragraphs"));
  if (!title) {
    return { error: "標題請填 1 至 80 個字。" };
  }
  if (!paragraphs) {
    return { error: "請至少保留一段。空白段請刪除，或填上原文。" };
  }

  const languageValue = formData.get("language");
  if (languageValue !== "zh" && languageValue !== "en") {
    return { error: SAVE_ERROR };
  }

  const lessonIdValue = formData.get("lessonId");
  const lessonId = typeof lessonIdValue === "string" ? lessonIdValue : "";
  const supabase = await createClient();
  const payload = paragraphsToJson(paragraphs);
  const basePath = languageValue === "zh" ? "/chinese/lessons" : "/english/lessons";

  if (!lessonId) {
    const { data, error } = await supabase.rpc("create_lesson", {
      p_language: languageValue,
      p_title: title,
      p_paragraphs: payload,
    });

    if (error || !data) {
      return { error: formError(error, LESSON_MIGRATION) };
    }

    redirect(`${basePath}/${data}`);
  }

  if (!isUuid(lessonId)) {
    return { error: SAVE_ERROR };
  }

  const { error } = await supabase.rpc("save_lesson", {
    p_lesson_id: lessonId,
    p_language: languageValue,
    p_title: title,
    p_paragraphs: payload,
  });

  if (error) {
    return { error: formError(error, LESSON_MIGRATION) };
  }

  redirect(`${basePath}/${lessonId}`);
}

export async function deleteLessonAction(formData: FormData): Promise<void> {
  await requireUser();
  const idValue = formData.get("id");
  const languageValue = formData.get("language");
  const id = typeof idValue === "string" ? idValue : "";
  const language: ContentLanguage = languageValue === "en" ? "en" : "zh";
  const basePath = language === "zh" ? "/chinese/lessons" : "/english/lessons";

  if (!isUuid(id)) {
    redirect(basePath);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lessons").delete().eq("id", id).eq("language", language);
  if (error) {
    redirect(`${basePath}/${id}?error=delete`);
  }

  redirect(basePath);
}

function listPath(language: ContentLanguage): string {
  return language === "zh" ? "/chinese/word-lists" : "/english/word-lists";
}

export async function saveWordListAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();

  const languageValue = formData.get("language");
  if (languageValue !== "zh" && languageValue !== "en") {
    return { error: SAVE_ERROR };
  }

  const title = parseTitle(formData.get("title"));
  const words = parseWords(formData.get("items"));
  if (!title) {
    return { error: "標題請填 1 至 80 個字。" };
  }
  if (!words) {
    return { error: "請至少保留一個詞語。空白列請刪除，或填上內容。" };
  }

  const listIdValue = formData.get("listId");
  const listId = typeof listIdValue === "string" ? listIdValue : "";
  const supabase = await createClient();
  const payload = wordsToJson(words);
  const kind = wordListKind(languageValue);

  if (!listId) {
    const { data, error } = await supabase.rpc("create_word_list", {
      p_title: title,
      p_language: kind.language,
      p_type: kind.type,
      p_items: payload,
    });

    if (error || !data) {
      return { error: formError(error) };
    }

    redirect(`${listPath(languageValue)}/${data}/edit`);
  }

  if (!isUuid(listId)) {
    return { error: SAVE_ERROR };
  }

  const { error } = await supabase.rpc("save_word_list", {
    p_word_list_id: listId,
    p_title: title,
    p_items: payload,
  });

  if (error) {
    return { error: formError(error) };
  }

  redirect(`${listPath(languageValue)}/${listId}/edit`);
}

export async function deleteWordListAction(formData: FormData): Promise<void> {
  await requireUser();
  const idValue = formData.get("id");
  const languageValue = formData.get("language");
  const id = typeof idValue === "string" ? idValue : "";
  const language: ContentLanguage = languageValue === "en" ? "en" : "zh";

  if (!isUuid(id)) {
    redirect(listPath(language));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("word_lists").delete().eq("id", id).eq("language", language);
  if (error) {
    redirect(`${listPath(language)}/${id}/edit?error=delete`);
  }

  redirect(listPath(language));
}
