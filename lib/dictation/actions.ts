"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/content/action-state";
import { isUuid } from "@/lib/content/parse";
import { compareAnswers } from "@/lib/dictation/compare";
import { buildLessonSentences } from "@/lib/dictation/lesson-sentences";
import { loadMistakeSentences, loadWordItemTexts } from "@/lib/dictation/load-session";
import { recordMistake } from "@/lib/dictation/mistakes";
import { segmentEnglishSentences, segmentSentences } from "@/lib/dictation/segment";
import { isChineseVoice, isDictationSpeed, isVoiceForLanguage, type DictationLanguage } from "@/lib/dictation/options";
import { requireUser } from "@/lib/auth/require-user";
import { isMissingSchema } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

const SESSION_MIGRATION = "supabase/migrations/20260928160000_stage3_sessions.sql";
const ANSWERS_MIGRATION = "supabase/migrations/20260928170000_typing_answers.sql";
const MISTAKES_MIGRATION = "supabase/migrations/20260928180000_mistakes.sql";

export type TypingCheckResult = {
  error?: string;
  correct: boolean;
  standardAnswer: string;
  studentAnswer: string;
  mismatchIndexes: number[];
  finished: boolean;
  correctCount: number;
  total: number;
  accuracy: number | null;
};

export async function startLessonDictation(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const lessonIdValue = formData.get("lessonId");
  const lessonId = typeof lessonIdValue === "string" ? lessonIdValue : "";
  const languageValue = formData.get("language");
  const language: DictationLanguage | null = languageValue === "zh" || languageValue === "en" ? languageValue : null;
  const rangeValue = formData.get("range");
  const range = typeof rangeValue === "string" ? rangeValue : "";
  const voiceValue = formData.get("voice");
  const speedValue = formData.get("speed");
  const modeValue = formData.get("mode");
  const mode = modeValue === "listen" || modeValue === "typing" ? modeValue : null;

  if (!language || !mode || !isUuid(lessonId) || !isVoiceForLanguage(voiceValue, language) || !isDictationSpeed(speedValue)) {
    return { error: "請選擇段落、方式、語音和速度。" };
  }

  const supabase = await createClient();
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", lessonId)
    .eq("language", language)
    .maybeSingle();

  if (isMissingSchema(lessonError?.code)) {
    return { error: "課文資料尚未就緒。" };
  }

  if (!lesson) {
    return { error: "找不到這篇課文。" };
  }

  const { data: paragraphs, error: paragraphError } = await supabase
    .from("paragraphs")
    .select("sort_order")
    .eq("lesson_id", lessonId);

  if (paragraphError || !paragraphs || paragraphs.length === 0) {
    return { error: "這篇課文還沒有段落。" };
  }

  const orders = new Set(paragraphs.map((paragraph) => paragraph.sort_order));
  let paragraphIndex: number | null = null;
  let sourceType: "lesson" | "paragraph" = "lesson";

  if (range !== "all") {
    const paragraphNumber = Number(range);
    if (!Number.isInteger(paragraphNumber) || !orders.has(paragraphNumber)) {
      return { error: "請選擇要默的段落。" };
    }
    paragraphIndex = paragraphNumber;
    sourceType = "paragraph";
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!student) {
    return { error: studentError ? "學生資料暫時讀取不到。" : "尚未有學生資料。" };
  }

  const { data: session, error: sessionError } = await supabase
    .from("dictation_sessions")
    .insert({
      owner_id: user.id,
      student_id: student.id,
      language,
      source_type: sourceType,
      source_id: lessonId,
      paragraph_index: paragraphIndex,
      mode,
      voice: voiceValue,
      speed: speedValue,
      completed: false,
    })
    .select("id")
    .single();

  if (isMissingSchema(sessionError?.code)) {
    return {
      error: `默書記錄尚未建立。請在 Supabase SQL Editor 貼上並執行 ${SESSION_MIGRATION} 的內容。`,
    };
  }

  if (sessionError || !session) {
    return { error: "未能開始默書，請再試一次。" };
  }

  if (language === "zh" && isChineseVoice(voiceValue)) {
    await supabase.from("profiles").update({ voice_zh: voiceValue }).eq("id", user.id);
  }

  redirect(language === "zh" ? `/chinese/dictation/${session.id}` : `/english/dictation/${session.id}`);
}

export async function startWordListDictation(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const listValue = formData.get("listId");
  const listId = typeof listValue === "string" ? listValue : "";
  const languageValue = formData.get("language");
  const language: DictationLanguage | null = languageValue === "zh" || languageValue === "en" ? languageValue : null;
  const voiceValue = formData.get("voice");
  const speedValue = formData.get("speed");
  const modeValue = formData.get("mode");
  const mode = modeValue === "listen" || modeValue === "typing" ? modeValue : null;

  if (!language || !mode || !isUuid(listId) || !isVoiceForLanguage(voiceValue, language) || !isDictationSpeed(speedValue)) {
    return { error: "請選擇方式、語音和速度。" };
  }

  const words = await loadWordItemTexts(listId, language);
  if (!words) {
    return { error: language === "zh" ? "這份詞語表還沒有詞語。" : "這份生字表還沒有生字。" };
  }

  const supabase = await createClient();
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!student) {
    return { error: studentError ? "學生資料暫時讀取不到。" : "尚未有學生資料。" };
  }

  const { data: session, error: sessionError } = await supabase
    .from("dictation_sessions")
    .insert({
      owner_id: user.id,
      student_id: student.id,
      language,
      source_type: "word_list",
      source_id: listId,
      paragraph_index: null,
      mode,
      voice: voiceValue,
      speed: speedValue,
      completed: false,
    })
    .select("id")
    .single();

  if (isMissingSchema(sessionError?.code)) {
    return {
      error: `默書記錄尚未建立。請在 Supabase SQL Editor 貼上並執行 ${SESSION_MIGRATION} 的內容。`,
    };
  }

  if (sessionError || !session) {
    return { error: "未能開始默書，請再試一次。" };
  }

  if (language === "zh" && isChineseVoice(voiceValue)) {
    await supabase.from("profiles").update({ voice_zh: voiceValue }).eq("id", user.id);
  }

  redirect(language === "zh" ? `/chinese/dictation/${session.id}` : `/english/dictation/${session.id}`);
}

export async function submitTypingAnswer(sessionId: string, sentenceIndex: number, studentAnswer: string): Promise<TypingCheckResult> {
  const empty: TypingCheckResult = {
    correct: false,
    standardAnswer: "",
    studentAnswer: "",
    mismatchIndexes: [],
    finished: false,
    correctCount: 0,
    total: 0,
    accuracy: null,
  };
  const user = await requireUser();

  if (!isUuid(sessionId) || !Number.isInteger(sentenceIndex) || sentenceIndex < 0 || studentAnswer.length > 4000) {
    return { ...empty, error: "未能核對這一句。" };
  }

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("dictation_sessions")
    .select("id, source_type, source_id, paragraph_index, language, mode, student_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (
    !session ||
    session.mode !== "typing" ||
    (session.language !== "zh" && session.language !== "en") ||
    (session.source_type !== "lesson" &&
      session.source_type !== "paragraph" &&
      session.source_type !== "word_list" &&
      session.source_type !== "mistakes")
  ) {
    return { ...empty, error: "找不到這次打字默書。" };
  }

  const mistakeItems = session.source_type === "mistakes" ? await loadMistakeSentences(sessionId) : null;
  const wordItems = session.source_type === "word_list" ? await loadWordItemTexts(session.source_id, session.language) : null;
  const lessonSentences =
    session.source_type === "mistakes" || session.source_type === "word_list"
      ? []
      : buildLessonSentences(
          (
            (
              await supabase
                .from("paragraphs")
                .select("sort_order, content")
                .eq("lesson_id", session.source_id)
                .order("sort_order", { ascending: true })
            ).data ?? []
          ).map((paragraph) => ({
            sortOrder: paragraph.sort_order,
            content: paragraph.content,
          })),
          session.paragraph_index,
          session.language,
        );
  const standard = mistakeItems
    ? mistakeItems[sentenceIndex]?.text
    : wordItems
      ? wordItems[sentenceIndex]
      : lessonSentences[sentenceIndex]?.text;
  const originId = mistakeItems ? mistakeItems[sentenceIndex]?.lessonId : session.source_id;
  const sentences = mistakeItems ?? (wordItems ?? lessonSentences).map((sentence) =>
    typeof sentence === "string" ? { text: sentence } : { text: sentence.text },
  );
  if (!standard) {
    return { ...empty, error: "找不到這一句。" };
  }

  const compared = compareAnswers(standard, studentAnswer);
  const { error: saveError } = await supabase.from("dictation_answers").upsert(
    {
      session_id: sessionId,
      owner_id: user.id,
      item_index: sentenceIndex,
      standard_answer: compared.standardAnswer,
      student_answer: compared.studentAnswer,
      is_correct: compared.correct,
    },
    { onConflict: "session_id,item_index" },
  );

  if (isMissingSchema(saveError?.code)) {
    return {
      ...empty,
      error: `答案資料表尚未建立。請在 Supabase SQL Editor 貼上並執行 ${ANSWERS_MIGRATION} 的內容。`,
    };
  }

  if (saveError) {
    return { ...empty, error: "答案未能儲存，請再試一次。" };
  }

  if (originId) {
    await recordMistake({
      ownerId: user.id,
      studentId: session.student_id,
      language: session.language,
      sourceId: originId,
      sourceType: session.source_type === "word_list" ? "word_list" : "lesson",
      standardAnswer: compared.standardAnswer,
      studentAnswer: compared.studentAnswer,
      correct: compared.correct,
    });
  }

  const { data: saved } = await supabase.from("dictation_answers").select("is_correct").eq("session_id", sessionId);
  const correctCount = (saved ?? []).filter((answer) => answer.is_correct).length;
  const total = sentences.length;
  const finished = (saved ?? []).length >= total && total > 0;
  const accuracy = finished ? Math.round((correctCount / total) * 1000) / 10 : null;

  if (finished) {
    await supabase
      .from("dictation_sessions")
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        correct_count: correctCount,
        wrong_count: total - correctCount,
        accuracy,
        score: accuracy,
      })
      .eq("id", sessionId);
  }

  return {
    correct: compared.correct,
    standardAnswer: compared.standardAnswer,
    studentAnswer: compared.studentAnswer,
    mismatchIndexes: compared.mismatchIndexes,
    finished,
    correctCount,
    total,
    accuracy,
  };
}

export async function startMistakeReview(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const languageValue = formData.get("language");
  const language: DictationLanguage | null = languageValue === "zh" || languageValue === "en" ? languageValue : null;
  const lessonValue = formData.get("lessonId");
  const lessonId = typeof lessonValue === "string" ? lessonValue : "";
  const modeValue = formData.get("mode");
  const mode = modeValue === "listen" || modeValue === "typing" ? modeValue : null;

  if (!language || !mode || (lessonId !== "all" && !isUuid(lessonId))) {
    return { error: "未能開始錯題重溫。" };
  }

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!student) {
    return { error: "尚未有學生資料。" };
  }

  let query = supabase
    .from("mistakes")
    .select("id")
    .eq("student_id", student.id)
    .eq("language", language)
    .eq("active", true)
    .order("last_wrong_at", { ascending: false });

  if (lessonId !== "all") {
    query = query.eq("source_id", lessonId);
  }

  const { data: mistakes, error: mistakeError } = await query;
  if (isMissingSchema(mistakeError?.code)) {
    return { error: `錯題資料表尚未建立。請在 Supabase SQL Editor 貼上並執行 ${MISTAKES_MIGRATION} 的內容。` };
  }

  const mistakeIds = (mistakes ?? []).map((mistake) => mistake.id);
  if (mistakeIds.length === 0) {
    return { error: "沒有需要重溫的錯題。" };
  }

  const { data: profile } = await supabase.from("profiles").select("voice_zh").eq("id", user.id).maybeSingle();
  const voice = language === "zh" && profile?.voice_zh === "zh-CN" ? "zh-CN" : language === "zh" ? "zh-HK" : "en-GB";
  const { data: session, error: sessionError } = await supabase
    .from("dictation_sessions")
    .insert({
      owner_id: user.id,
      student_id: student.id,
      language,
      source_type: "mistakes",
      source_id: lessonId === "all" ? student.id : lessonId,
      paragraph_index: null,
      mode,
      voice,
      speed: "1",
      completed: false,
      mistake_ids: mistakeIds,
    })
    .select("id")
    .single();

  if (isMissingSchema(sessionError?.code)) {
    return { error: `錯題資料表尚未建立。請在 Supabase SQL Editor 貼上並執行 ${MISTAKES_MIGRATION} 的內容。` };
  }

  if (sessionError || !session) {
    return { error: "未能開始錯題重溫，請再試一次。" };
  }

  redirect(language === "zh" ? `/chinese/dictation/${session.id}` : `/english/dictation/${session.id}`);
}

export async function addPaperMistake(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const lessonValue = formData.get("lessonId");
  const lessonId = typeof lessonValue === "string" ? lessonValue : "";
  const standardValue = formData.get("standardAnswer");
  const studentValue = formData.get("studentAnswer");
  const standardText = typeof standardValue === "string" ? standardValue.trim() : "";
  const studentText = typeof studentValue === "string" ? studentValue.trim() : "";

  if (!isUuid(lessonId) || standardText.length === 0 || standardText.length > 4000 || studentText.length > 4000) {
    return { error: "請選擇課文，並貼上要記錄的原文。" };
  }

  const supabase = await createClient();
  const { data: lesson } = await supabase.from("lessons").select("id, language").eq("id", lessonId).maybeSingle();
  if (!lesson || (lesson.language !== "zh" && lesson.language !== "en")) {
    return { error: "找不到這篇課文。" };
  }

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!student) {
    return { error: "尚未有學生資料。" };
  }

  const clauses = lesson.language === "en" ? segmentEnglishSentences(standardText) : segmentSentences(standardText);
  if (clauses.length === 0) {
    return { error: "請貼上要記錄的原文。" };
  }

  const studentAnswer = clauses.length === 1 && studentText.length > 0 ? studentText : "（紙上默書）";
  for (const clause of clauses) {
    const result = await recordMistake({
      ownerId: user.id,
      studentId: student.id,
      language: lesson.language,
      sourceId: lesson.id,
      standardAnswer: clause,
      studentAnswer,
      correct: false,
    });
    if (result === "missing") {
      return { error: `錯題資料表尚未建立。請在 Supabase SQL Editor 貼上並執行 ${MISTAKES_MIGRATION} 的內容。` };
    }
    if (result === "failed") {
      return { error: "錯題未能儲存，請再試一次。" };
    }
  }

  redirect(`/mistakes?language=${lesson.language}&added=${clauses.length}`);
}
