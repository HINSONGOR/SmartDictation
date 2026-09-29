import type { DictationLanguage } from "@/lib/dictation/options";
import { segmentEnglishSentences, segmentSentences, selectByParagraph } from "@/lib/dictation/segment";

export type LessonParagraph = {
  sortOrder: number;
  content: string;
};

export type DictationSentence = {
  paragraphSortOrder: number;
  text: string;
};

export function buildLessonSentences(
  paragraphs: readonly LessonParagraph[],
  paragraphNumber: number | null,
  language: DictationLanguage,
): DictationSentence[] {
  const selected = selectByParagraph(
    paragraphs.map((paragraph) => ({
      sortOrder: paragraph.sortOrder,
      content: paragraph.content,
    })),
    paragraphNumber,
  );

  const sentences: DictationSentence[] = [];
  for (const paragraph of selected) {
    const split = language === "en" ? segmentEnglishSentences : segmentSentences;
    for (const text of split(paragraph.content)) {
      sentences.push({ paragraphSortOrder: paragraph.sortOrder, text });
    }
  }

  return sentences;
}

export function buildWordItems(texts: readonly string[], language: DictationLanguage): string[] {
  const split = language === "en" ? segmentEnglishSentences : segmentSentences;
  const items: string[] = [];
  for (const text of texts) {
    items.push(...split(text));
  }
  return items;
}
