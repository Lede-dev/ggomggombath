import assert from "node:assert/strict";
import test from "node:test";
import { assessCaseQuality, extractIssues, extractProduct, formatNaverDate } from "../scripts/blog-content.mjs";

test("normalizes absolute and relative Naver dates to a stable calendar date", () => {
  assert.deepEqual(formatNaverDate("2026. 7. 28."), { display: "2026.07.28", iso: "2026-07-28" });
  assert.deepEqual(
    formatNaverDate("11시간 전", { now: new Date("2026-07-28T06:00:00.000Z") }),
    { display: "2026.07.28", iso: "2026-07-28" },
  );
  assert.deepEqual(
    formatNaverDate("알 수 없음", { now: new Date("2026-07-28T06:00:00.000Z"), previousIso: "2026-05-06" }),
    { display: "2026.05.06", iso: "2026-05-06" },
  );
});

test("extracts model names from the title and installation paragraphs", () => {
  assert.equal(extractProduct("대림바스 CC-735 변기 교체"), "대림바스 CC-735");
  assert.equal(
    extractProduct("공용욕실 교체", ["세면기(CL-384)와 변기(CC-735), 수전(DL-L5110)을 설치했습니다."]),
    "CL-384 · CC-735 · DL-L5110",
  );
});

test("uses site-specific problem paragraphs and ignores generic symptom lists", () => {
  const issues = extractIssues("아파트 변기 교체", "", [
    "이런 증상이 있다면 교체 시기입니다. 막힘과 냄새가 발생할 수 있습니다.",
    "실제로 문의를 주시는 고객님들의 상당수는 누수와 고장, 노후 문제를 말씀하십니다.",
    "이번 현장에서 고객님께서 가장 불편해하셨던 부분은",
    "고객님께서 물내림이 약하고 물탱크가 깨져 교체를 요청하셨습니다.",
    "공용욕실 변기 교체 후",
    "기존에 반복되던 막힘과 냄새 문제를 해결했습니다.",
  ]);
  assert.deepEqual(issues, ["도기 파손", "물내림 저하"]);
});

test("only marks evidence-rich cases as indexable", () => {
  const base = {
    area: "김포",
    siteLabel: "구래동 아파트",
    service: "양변기 교체",
    product: "CC-735",
    issues: [],
    content: Array.from({ length: 12 }, (_, index) => index < 2 ? "기존 변기를 철거하고 새 제품을 설치했습니다." : `현장 기록 ${index}`),
    images: ["1", "2", "3"],
    highlights: ["문제", "작업", "확인"],
    editorialMode: "ai-grounded",
    editorialStatus: "approved",
  };
  assert.equal(assessCaseQuality(base), "indexable");
  assert.equal(assessCaseQuality({ ...base, product: "", issues: [] }), "source-only");
  assert.equal(
    assessCaseQuality({ ...base, editorialMode: "source-derived", editorialStatus: "review-required" }),
    "source-only",
  );
});
