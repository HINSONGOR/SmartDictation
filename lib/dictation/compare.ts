export type AnswerComparison = {
  correct: boolean;
  standardAnswer: string;
  studentAnswer: string;
  mismatchIndexes: number[];
};

export function compareAnswers(standardAnswer: string, studentAnswer: string): AnswerComparison {
  const expected = standardAnswer.trim();
  const actual = studentAnswer.trim();
  const expectedChars = Array.from(expected);
  const actualChars = Array.from(actual);
  const mismatchIndexes: number[] = [];
  const length = Math.max(expectedChars.length, actualChars.length);

  for (let index = 0; index < length; index += 1) {
    if (expectedChars[index] !== actualChars[index]) {
      mismatchIndexes.push(index);
    }
  }

  return {
    correct: expected.length > 0 && mismatchIndexes.length === 0,
    standardAnswer,
    studentAnswer: actual,
    mismatchIndexes,
  };
}
