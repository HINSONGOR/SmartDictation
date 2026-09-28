import type { ContentLanguage, Json, WordListType } from "@/lib/database.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type DraftParagraph = {
  id: string | null;
  content: string;
};

export type DraftWord = {
  id: string | null;
  text: string;
};

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function parseTitle(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const title = value.trim();
  if (title.length < 1 || title.length > 80) {
    return null;
  }

  return title;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    record[key] = entry;
  }
  return record;
}

function readId(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string" || !isUuid(value)) {
    return undefined;
  }

  return value;
}

export function parseParagraphs(value: unknown): DraftParagraph[] | null {
  if (typeof value !== "string") {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 30) {
    return null;
  }

  const paragraphs: DraftParagraph[] = [];
  for (const item of parsed) {
    const record = readRecord(item);
    if (!record || typeof record.content !== "string") {
      return null;
    }

    const content = record.content.trim();
    if (content.length < 1 || content.length > 4000) {
      return null;
    }

    const id = readId(record.id);
    if (id === undefined) {
      return null;
    }

    paragraphs.push({ id, content });
  }

  return paragraphs;
}

export function parseWords(value: unknown): DraftWord[] | null {
  if (typeof value !== "string") {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 200) {
    return null;
  }

  const words: DraftWord[] = [];
  for (const item of parsed) {
    const record = readRecord(item);
    if (!record || typeof record.text !== "string") {
      return null;
    }

    const text = record.text.trim();
    if (text.length < 1 || text.length > 80) {
      return null;
    }

    const id = readId(record.id);
    if (id === undefined) {
      return null;
    }

    words.push({ id, text });
  }

  return words;
}

export function paragraphsToJson(paragraphs: DraftParagraph[]): Json {
  return paragraphs.map((paragraph) => ({
    id: paragraph.id,
    content: paragraph.content,
  }));
}

export function wordsToJson(words: DraftWord[]): Json {
  return words.map((word) => ({
    id: word.id,
    text: word.text,
  }));
}

export function wordListKind(language: ContentLanguage): {
  language: ContentLanguage;
  type: WordListType;
} {
  if (language === "zh") {
    return { language: "zh", type: "chinese_vocabulary" };
  }

  return { language: "en", type: "english_vocabulary" };
}

export function paragraphLabel(index: number): string {
  const labels = ["第一段", "第二段", "第三段", "第四段", "第五段", "第六段", "第七段", "第八段", "第九段", "第十段"];
  return labels[index] ?? `第 ${index + 1} 段`;
}

export function moveItem<T>(items: readonly T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  const current = items[index];
  const other = items[target];
  if (current === undefined || other === undefined) {
    return [...items];
  }

  const next = [...items];
  next[index] = other;
  next[target] = current;
  return next;
}
