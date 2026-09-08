import test from "node:test";
import assert from "node:assert/strict";
import { createSubmissionId, submitAnswers } from "./api.ts";

const answers = {
  name: "Оля", preferredDate: "2030-01-01", preferredTime: "18:30",
  flowers: "Тюльпани", food: "Суші", drinks: "Чай", location: "Парк",
  mood: "Прогулянка", dislikes: "", notes: "",
};

test("sends the API field names and requires a matching receipt", async (t) => {
  const id = createSubmissionId();
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/responses");
    const body = JSON.parse(options.body);
    assert.equal(body.preferred_date, answers.preferredDate);
    assert.equal(body.preferred_time, answers.preferredTime);
    assert.equal(body.submission_id, id);
    assert.equal(body.preferredDate, undefined);
    return Response.json({ id, status: "submitted" });
  });
  await submitAnswers(answers, id);
});

test("rejects server errors, network failure and incorrect confirmations", async (t) => {
  const id = createSubmissionId();
  const fetchMock = t.mock.method(globalThis, "fetch");
  for (const status of [422, 409, 500]) {
    fetchMock.mock.mockImplementation(async () => new Response("", { status }));
    await assert.rejects(submitAnswers(answers, id));
  }
  fetchMock.mock.mockImplementation(async () => { throw new TypeError("offline"); });
  await assert.rejects(submitAnswers(answers, id));
  fetchMock.mock.mockImplementation(async () => Response.json({ id: "wrong", status: "submitted" }));
  await assert.rejects(submitAnswers(answers, id));
});
