import assert from "node:assert/strict";
import test from "node:test";
import { hanCharacters, wrongHanCharacters } from "./strokes.ts";

test("collects traditional characters once, in order", () => {
  assert.deepEqual(hanCharacters("我去圖書館。我"), ["我", "去", "圖", "書", "館"]);
});

test("uses the standard character at each wrong position", () => {
  assert.deepEqual(wrongHanCharacters("今天很好。", [1, 4]), ["天"]);
});

test("ignores punctuation and repeated wrong characters", () => {
  assert.deepEqual(wrongHanCharacters("你好。", [2]), []);
  assert.deepEqual(wrongHanCharacters("學學", [0, 1]), ["學"]);
});
