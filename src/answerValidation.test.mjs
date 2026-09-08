import test from "node:test";
import assert from "node:assert/strict";
import { getTextAnswerError } from "./answerValidation.ts";
import rules from "../shared/answer-rules.json" with { type: "json" };

test("shared Ukrainian, transliteration and meaningful-answer regression cases", () => {
  for (const value of rules.cases.reject) assert.notEqual(getTextAnswerError(value, true), "", value);
  for (const value of rules.cases.accept) assert.equal(getTextAnswerError(value, true), "", value);
});

test("rejects vague answers despite casing, spacing, punctuation and emoji", () => {
  for (const value of ["Незнаю", " НЕ ЗНАЮ!!! ❤️ ", "не-знаю", "Ну я не знаю", "не знаю що хочу", "хз", "мені байдуже", "idk", "???", "123"]) {
    assert.notEqual(getTextAnswerError(value, true), "", value);
  }
});

test("accepts specific preferences, boundaries and contextual uncertainty", () => {
  for (const value of ["Тюльпани", "Суші", "Кафе біля парку", "Не хочу квітів", "Немає обмежень", "Не знаю назви, але хочу кафе біля річки", "Лі"]) {
    assert.equal(getTextAnswerError(value, true), "", value);
  }
});

test("allows omitted optional answers but validates them when filled", () => {
  assert.equal(getTextAnswerError("  ", false), "");
  assert.notEqual(getTextAnswerError("  ", true), "");
  assert.notEqual(getTextAnswerError("не знаю", false), "");
});
