const SENTENCE_ENDINGS = new Set(["。", "！", "？", "，", "、", "：", "；"]);
const CLOSERS = new Set(["」", "』", "）", "》", "】"]);

function pushSentence(sentences: string[], value: string) {
  const sentence = value.trim();
  if (sentence.length > 0) {
    sentences.push(sentence);
  }
}

export function segmentSentences(text: string): string[] {
  const characters = Array.from(text.replace(/\r\n/g, "\n"));
  const sentences: string[] = [];
  let current = "";

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index] ?? "";
    const next = characters[index + 1];
    current += character;

    const pair = `${character}${next ?? ""}`;
    if (pair === "……" || pair === "——") {
      current += next;
      index += 1;
      while (CLOSERS.has(characters[index + 1] ?? "")) {
        index += 1;
        current += characters[index] ?? "";
      }
      pushSentence(sentences, current);
      current = "";
      continue;
    }

    if (character === "！" && next === "？") {
      current += next;
      index += 1;
      while (CLOSERS.has(characters[index + 1] ?? "")) {
        index += 1;
        current += characters[index] ?? "";
      }
      pushSentence(sentences, current);
      current = "";
      continue;
    }

    if (SENTENCE_ENDINGS.has(character)) {
      while (CLOSERS.has(characters[index + 1] ?? "")) {
        index += 1;
        current += characters[index] ?? "";
      }
      pushSentence(sentences, current);
      current = "";
    }
  }

  pushSentence(sentences, current);
  return sentences;
}

const ENGLISH_CLOSERS = new Set(['"', "'", "”", "’", ")", "]"]);
const TITLE_ABBREVIATIONS = new Set(["mr", "mrs", "ms", "dr", "st", "prof"]);

function isDigit(value: string | undefined): boolean {
  return value !== undefined && value >= "0" && value <= "9";
}

function previousWord(value: string): string {
  const match = /[A-Za-z]+$/.exec(value);
  return match?.[0].toLowerCase() ?? "";
}

export function segmentEnglishSentences(text: string): string[] {
  const characters = Array.from(text.replace(/\r\n/g, "\n"));
  const sentences: string[] = [];
  let current = "";

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index] ?? "";
    const next = characters[index + 1];
    current += character;

    if (character === "." && next === ".") {
      while (characters[index + 1] === ".") {
        index += 1;
        current += characters[index] ?? "";
      }
      while (ENGLISH_CLOSERS.has(characters[index + 1] ?? "")) {
        index += 1;
        current += characters[index] ?? "";
      }
      pushSentence(sentences, current);
      current = "";
      continue;
    }

    if (character === "," && isDigit(characters[index - 1]) && isDigit(next)) {
      continue;
    }

    if (character === "," || character === ":" || character === ";") {
      while (ENGLISH_CLOSERS.has(characters[index + 1] ?? "")) {
        index += 1;
        current += characters[index] ?? "";
      }
      pushSentence(sentences, current);
      current = "";
      continue;
    }

    if (character === "!" && next === "?") {
      current += next;
      index += 1;
      while (ENGLISH_CLOSERS.has(characters[index + 1] ?? "")) {
        index += 1;
        current += characters[index] ?? "";
      }
      pushSentence(sentences, current);
      current = "";
      continue;
    }

    if (character === "." || character === "!" || character === "?") {
      if (character === "." && isDigit(characters[index - 1]) && isDigit(next)) {
        continue;
      }

      if (character === "." && TITLE_ABBREVIATIONS.has(previousWord(current.slice(0, -1)))) {
        continue;
      }

      while (ENGLISH_CLOSERS.has(characters[index + 1] ?? "")) {
        index += 1;
        current += characters[index] ?? "";
      }
      pushSentence(sentences, current);
      current = "";
    }
  }

  pushSentence(sentences, current);
  return sentences;
}

export function selectByParagraph<T extends { sortOrder: number }>(
  items: readonly T[],
  paragraphNumber: number | null,
): T[] {
  const ordered = [...items].sort((left, right) => left.sortOrder - right.sortOrder);
  if (paragraphNumber === null) {
    return ordered;
  }

  return ordered.filter((item) => item.sortOrder === paragraphNumber);
}
