import assert from "node:assert/strict";
import test from "node:test";
import { punctuationToSpeech } from "./punctuation.ts";
import { segmentEnglishSentences, segmentSentences, selectByParagraph } from "./segment.ts";

test("splits Chinese sentences on full stops, exclamation marks, and question marks", () => {
  assert.deepEqual(segmentSentences("你好。今天很好！你去了哪裡？"), [
    "你好。",
    "今天很好！",
    "你去了哪裡？",
  ]);
});

test("stops after each Chinese pause mark and keeps that mark on the clause", () => {
  assert.deepEqual(segmentSentences("我今天和媽媽一起去公園，然後再去圖書館。"), [
    "我今天和媽媽一起去公園，",
    "然後再去圖書館。",
  ]);
  assert.deepEqual(segmentSentences("蘋果、橙：水果；還有茶。"), ["蘋果、", "橙：", "水果；", "還有茶。"]);
});

test("treats ！？ as one sentence ending and keeps the closing quote", () => {
  assert.deepEqual(segmentSentences("他說：「真的！？」然後走了。"), ["他說：", "「真的！？」", "然後走了。"]);
});

test("selecting paragraph 4 does not include earlier paragraphs", () => {
  const paragraphs = [
    { sortOrder: 1, content: "第一段。" },
    { sortOrder: 2, content: "第二段。" },
    { sortOrder: 4, content: "第四段。" },
  ];

  assert.deepEqual(selectByParagraph(paragraphs, 4), [{ sortOrder: 4, content: "第四段。" }]);
  assert.deepEqual(
    selectByParagraph(paragraphs, null).map((paragraph) => paragraph.sortOrder),
    [1, 2, 4],
  );
});

test("reads Chinese punctuation aloud", () => {
  assert.equal(
    punctuationToSpeech("我今天和媽媽一起去公園，然後再去圖書館。"),
    "我今天和媽媽一起去公園逗號然後再去圖書館句號",
  );
});

test("stops after each English pause mark", () => {
  assert.deepEqual(segmentEnglishSentences("On a cold winter evening in San Francisco in 1905, the fog rolled in."), [
    "On a cold winter evening in San Francisco in 1905,",
    "the fog rolled in.",
  ]);
  assert.deepEqual(segmentEnglishSentences("I went to the park, then the library. Did you? Wait!"), [
    "I went to the park,",
    "then the library.",
    "Did you?",
    "Wait!",
  ]);
});

test("keeps decimals and titles together, and stops after an ellipsis", () => {
  assert.deepEqual(segmentEnglishSentences("The price is 3.14 dollars."), ["The price is 3.14 dollars."]);
  assert.deepEqual(segmentEnglishSentences("There were 1,900 people."), ["There were 1,900 people."]);
  assert.deepEqual(segmentEnglishSentences("Mr. Chan went home."), ["Mr. Chan went home."]);
  assert.deepEqual(segmentEnglishSentences("Hello... wait. Done."), ["Hello...", "wait.", "Done."]);
});

test("keeps the closing quote with the clause that just ended", () => {
  assert.deepEqual(segmentEnglishSentences('She said, "Hello." Then she left.'), [
    "She said,",
    '"Hello."',
    "Then she left.",
  ]);
});

test("reads English punctuation aloud", () => {
  assert.equal(
    punctuationToSpeech("I went to the park, then the library.", "en"),
    "I went to the park comma then the library full stop",
  );
});
