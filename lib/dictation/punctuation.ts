const SPOKEN_MARKS: Record<string, string> = {
  "。": "句號",
  "，": "逗號",
  "、": "頓號",
  "？": "問號",
  "！": "感嘆號",
  "：": "冒號",
  "；": "分號",
  "「": "開引號",
  "『": "開引號",
  "」": "關引號",
  "』": "關引號",
  "（": "開括號",
  "）": "關括號",
  "《": "開書名號",
  "》": "關書名號",
  "……": "省略號",
  "——": "破折號",
};

const ENGLISH_MARKS: Record<string, string> = {
  ".": " full stop ",
  ",": " comma ",
  "?": " question mark ",
  "!": " exclamation mark ",
  ":": " colon ",
  ";": " semicolon ",
  "'": " apostrophe ",
  "’": " apostrophe ",
  "‘": " apostrophe ",
  '"': " quotation mark ",
  "“": " quotation mark ",
  "”": " quotation mark ",
};

export function punctuationToSpeech(text: string, language: "zh" | "en" = "zh"): string {
  return language === "en" ? englishPunctuationToSpeech(text) : chinesePunctuationToSpeech(text);
}

function chinesePunctuationToSpeech(text: string): string {
  const characters = Array.from(text);
  let spoken = "";

  for (let index = 0; index < characters.length; index += 1) {
    const pair = `${characters[index] ?? ""}${characters[index + 1] ?? ""}`;
    if (pair === "……" || pair === "——") {
      spoken += SPOKEN_MARKS[pair] ?? pair;
      index += 1;
      continue;
    }

    const character = characters[index] ?? "";
    spoken += SPOKEN_MARKS[character] ?? character;
  }

  return spoken;
}

function englishPunctuationToSpeech(text: string): string {
  const characters = Array.from(text);
  let spoken = "";

  for (let index = 0; index < characters.length; index += 1) {
    if (characters[index] === "." && characters[index + 1] === "." && characters[index + 2] === ".") {
      spoken += " ellipsis ";
      index += 2;
      continue;
    }

    const character = characters[index] ?? "";
    spoken += ENGLISH_MARKS[character] ?? character;
  }

  return spoken.replace(/[ \t]+/g, " ").trim();
}
