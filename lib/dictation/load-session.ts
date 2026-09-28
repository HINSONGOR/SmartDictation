import { paragraphLabel } from "@/lib/content/parse";
import { compareAnswers } from "@/lib/dictation/compare";
import { buildLessonSentences } from "@/lib/dictation/lesson-sentences";
import {
  defaultVoice,
  isDictationSpeed,
  isVoiceForLanguage,
  type DictationLanguage,
  type DictationSpeed,
  type DictationVoice,
} from "@/lib/dictation/options";
import { isMissingSchema } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

export type ListenCue = {
  paragraphSortOrder: number | null;
};

export type SavedTypingAnswer = {
  itemIndex: number;
  standardAnswer: string;
  studentAnswer: string;
  correct: boolean;
  mismatchIndexes: number[];
};

export type ListenSession = {
  id: string;
  title: string;
  rangeLabel: string;
  language: DictationLanguage;
  mode: "listen" | "typing";
  voice: DictationVoice;
  speed: DictationSpeed;
  cues: ListenCue[];
  selectHref: string;
  answersReady: boolean;
  savedAnswers: SavedTypingAnswer[];
};

export async function loadListenSession(sessionId: string, language: DictationLanguage): Promise<ListenSession | null> {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("dictation_sessions")
    .select("id, source_type, source_id, paragraph_index, voice, speed, language, mode")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.language !== language || (session.mode !== "listen" && session.mode !== "typing")) {
    return null;
  }

  if (session.source_type === "mistakes") {
    const mistakes = await loadMistakeSentences(session.id);
    if (!mistakes) {
      return null;
    }
    const saved = session.mode === "typing" ? await loadSavedAnswers(session.id) : { ready: true, answers: [] };
    const { data: lesson } = await supabase.from("lessons").select("title").eq("id", session.source_id).maybeSingle();
    return {
      id: session.id,
      title: lesson?.title ?? "錯題重溫",
      rangeLabel: "錯題",
      language,
      mode: session.mode,
      voice: isVoiceForLanguage(session.voice, language) ? session.voice : defaultVoice(language),
      speed: isDictationSpeed(session.speed) ? session.speed : "1",
      cues: mistakes.map(() => ({ paragraphSortOrder: null })),
      selectHref: `/mistakes?language=${language}`,
      answersReady: saved.ready,
      savedAnswers: saved.answers,
    };
  }

  if (session.source_type !== "lesson" && session.source_type !== "paragraph") {
    return null;
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title")
    .eq("id", session.source_id)
    .eq("language", language)
    .maybeSingle();

  if (!lesson) {
    return null;
  }

  const { data: paragraphs } = await supabase
    .from("paragraphs")
    .select("sort_order, content")
    .eq("lesson_id", lesson.id)
    .order("sort_order", { ascending: true });

  if (!paragraphs) {
    return null;
  }

  const sentences = buildLessonSentences(
    paragraphs.map((paragraph) => ({
      sortOrder: paragraph.sort_order,
      content: paragraph.content,
    })),
    session.paragraph_index,
    language,
  );
  const section = language === "zh" ? "chinese" : "english";
  const saved = session.mode === "typing" ? await loadSavedAnswers(session.id) : { ready: true, answers: [] };

  return {
    id: session.id,
    title: lesson.title,
    rangeLabel: session.paragraph_index === null ? "全課" : paragraphLabel(session.paragraph_index - 1),
    language,
    mode: session.mode,
    voice: isVoiceForLanguage(session.voice, language) ? session.voice : defaultVoice(language),
    speed: isDictationSpeed(session.speed) ? session.speed : "1",
    cues: sentences.map((sentence) => ({ paragraphSortOrder: sentence.paragraphSortOrder })),
    selectHref: `/${section}/lessons/${lesson.id}/select`,
    answersReady: saved.ready,
    savedAnswers: saved.answers,
  };
}

async function loadSavedAnswers(sessionId: string): Promise<{ ready: boolean; answers: SavedTypingAnswer[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dictation_answers")
    .select("item_index, standard_answer, student_answer, is_correct")
    .eq("session_id", sessionId)
    .order("item_index", { ascending: true });

  if (isMissingSchema(error?.code)) {
    return { ready: false, answers: [] };
  }

  if (error || !data) {
    return { ready: true, answers: [] };
  }

  return {
    ready: true,
    answers: data.map((answer) => {
      const compared = compareAnswers(answer.standard_answer, answer.student_answer);
      return {
        itemIndex: answer.item_index,
        standardAnswer: answer.standard_answer,
        studentAnswer: answer.student_answer,
        correct: answer.is_correct,
        mismatchIndexes: compared.mismatchIndexes,
      };
    }),
  };
}

export async function loadMistakeSentences(
  sessionId: string,
): Promise<{ text: string; lessonId: string }[] | null> {
  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("dictation_sessions")
    .select("mistake_ids")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !session?.mistake_ids || session.mistake_ids.length === 0) {
    return null;
  }

  const { data: mistakes } = await supabase
    .from("mistakes")
    .select("id, source_id, standard_answer")
    .in("id", session.mistake_ids);

  if (!mistakes) {
    return null;
  }

  const byId = new Map(mistakes.map((item) => [item.id, item]));
  const sentences: { text: string; lessonId: string }[] = [];
  for (const id of session.mistake_ids) {
    const item = byId.get(id);
    if (item) {
      sentences.push({ text: item.standard_answer, lessonId: item.source_id });
    }
  }

  return sentences.length > 0 ? sentences : null;
}

export async function loadListenSentence(
  sessionId: string,
  sentenceIndex: number,
): Promise<{ text: string; language: DictationLanguage } | null> {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("dictation_sessions")
    .select("source_type, source_id, paragraph_index, language, mode")
    .eq("id", sessionId)
    .maybeSingle();

  if (
    !session ||
    (session.language !== "zh" && session.language !== "en") ||
    (session.mode !== "listen" && session.mode !== "typing") ||
    (session.source_type !== "lesson" && session.source_type !== "paragraph" && session.source_type !== "mistakes")
  ) {
    return null;
  }

  const language = session.language;

  if (session.source_type === "mistakes") {
    const mistakes = await loadMistakeSentences(sessionId);
    const text = mistakes?.[sentenceIndex]?.text;
    return text ? { text, language } : null;
  }

  const { data: paragraphs } = await supabase
    .from("paragraphs")
    .select("sort_order, content")
    .eq("lesson_id", session.source_id)
    .order("sort_order", { ascending: true });

  if (!paragraphs) {
    return null;
  }

  const sentences = buildLessonSentences(
    paragraphs.map((paragraph) => ({
      sortOrder: paragraph.sort_order,
      content: paragraph.content,
    })),
    session.paragraph_index,
    language,
  );
  const text = sentences[sentenceIndex]?.text;

  return text ? { text, language } : null;
}
