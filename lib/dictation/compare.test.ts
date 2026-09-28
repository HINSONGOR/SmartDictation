import assert from "node:assert/strict";
import test from "node:test";
import { compareAnswers } from "./compare.ts";

test("matches a sentence exactly, including punctuation", () => {
  const result = compareAnswers("我去公園。", "我去公園。");
  assert.equal(result.correct, true);
  assert.deepEqual(result.mismatchIndexes, []);
});

test("trims the edges and still compares the characters strictly", () => {
  const result = compareAnswers("我去公園。", "  我去公園。  ");
  assert.equal(result.correct, true);
});

test("marks the wrong character and keeps punctuation strict", () => {
  const result = compareAnswers("我去公園。", "我去公園");
  assert.equal(result.correct, false);
  assert.deepEqual(result.mismatchIndexes, [4]);
});

test("marks a different Chinese character", () => {
  const result = compareAnswers("今天很好。", "今日很好。");
  assert.equal(result.correct, false);
  assert.deepEqual(result.mismatchIndexes, [1]);
});

test("keeps English case and punctuation strict", () => {
  assert.equal(compareAnswers("I like apples.", "I like apples.").correct, true);
  assert.equal(compareAnswers("I like apples.", "i like apples.").correct, false);
  assert.equal(compareAnswers("I like apples.", "I like apples").correct, false);
});
