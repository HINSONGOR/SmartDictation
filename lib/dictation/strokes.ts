const HAN_CHARACTER = /\p{Script=Han}/u;

export function hanCharacters(text: string): string[] {
  const seen = new Set<string>();
  const characters: string[] = [];

  for (const character of Array.from(text)) {
    if (!HAN_CHARACTER.test(character) || seen.has(character)) {
      continue;
    }
    seen.add(character);
    characters.push(character);
  }

  return characters;
}

export function wrongHanCharacters(standardAnswer: string, mismatchIndexes: readonly number[]): string[] {
  const characters = Array.from(standardAnswer.trim());
  const seen = new Set<string>();
  const wrong: string[] = [];

  for (const index of mismatchIndexes) {
    const character = characters[index];
    if (!character || !HAN_CHARACTER.test(character) || seen.has(character)) {
      continue;
    }
    seen.add(character);
    wrong.push(character);
  }

  return wrong;
}
