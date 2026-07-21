import assert from "node:assert/strict";
import test from "node:test";
import { generateEditorialSummary, validateEditorialSummary } from "../scripts/editorial-summary.mjs";

const content = [
  "고객님께서 물탱크가 깨져 변기 교체를 요청하셨습니다.",
  "기존 변기를 철거한 뒤 새 정심과 대림바스 CC-735 변기를 설치했습니다.",
  "설치 후 누수 여부와 물내림 상태를 확인하고 마무리했습니다.",
];

const validSummary = {
  summary: "물탱크가 깨져 변기 교체가 필요했던 현장입니다. 기존 변기를 철거하고 대림바스 CC-735를 설치한 뒤 누수와 물내림 상태를 점검했습니다.",
  summarySourceParagraphs: [1, 2, 3],
  highlights: [
    { kind: "problem", text: "물탱크 파손 때문에 변기 교체를 요청한 현장입니다.", sourceParagraphs: [1] },
    { kind: "work", text: "기존 변기를 철거하고 새 정심과 대림바스 CC-735를 설치했습니다.", sourceParagraphs: [2] },
    { kind: "result", text: "설치 후 누수 여부와 물내림 상태를 점검하고 작업을 마쳤습니다.", sourceParagraphs: [3] },
  ],
};

test("accepts a concise summary grounded in numbered source paragraphs", () => {
  const result = validateEditorialSummary(validSummary, content);

  assert.equal(result.valid, true);
  assert.deepEqual(result.value.highlights, validSummary.highlights.map((highlight) => highlight.text));
  assert.deepEqual(result.value.evidence.summary, [1, 2, 3]);
});

test("rejects facts and promotional copy that are absent from the source", () => {
  const result = validateEditorialSummary({
    ...validSummary,
    summary: "물탱크가 깨져 변기를 교체했습니다. 원문에 없는 대림바스 CC-766을 완벽하게 설치했으니 확인해 보세요.",
  }, content);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("광고성")));
  assert.ok(result.errors.some((error) => error.includes("모델명")));
});

test("retries a rejected nano response once with the mini fallback", async () => {
  const requests = [];
  const fetchImpl = async (_url, options) => {
    const request = JSON.parse(options.body);
    requests.push(request);
    const output = request.model === "gpt-5-nano"
      ? { ...validSummary, summary: "확인해 보세요. 완벽한 변기 교체 사례입니다." }
      : validSummary;
    return {
      ok: true,
      json: async () => ({ output: [{ content: [{ type: "output_text", text: JSON.stringify(output) }] }] }),
    };
  };

  const result = await generateEditorialSummary({
    title: "물탱크 파손 변기 교체",
    area: "노원구",
    service: "양변기 교체",
    product: "대림바스 CC-735",
    content,
  }, { apiKey: "test-key", fetchImpl });

  assert.equal(result.ok, true);
  assert.equal(result.model, "gpt-5-mini");
  assert.deepEqual(requests.map((request) => request.model), ["gpt-5-nano", "gpt-5-mini"]);
  assert.equal(requests[0].store, false);
  assert.equal(requests[0].reasoning.effort, "minimal");
  assert.equal(requests[0].max_output_tokens, 2_400);
  assert.equal(requests[0].text.format.type, "json_schema");
});
