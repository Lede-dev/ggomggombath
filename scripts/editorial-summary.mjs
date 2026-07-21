const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_PRIMARY_MODEL = "gpt-5-nano";
const DEFAULT_FALLBACK_MODEL = "gpt-5-mini";

export const EDITORIAL_VERSION = "ai-grounded-v1";

const forbiddenCopy = [
  /확인해\s*보세요/,
  /소개(?:해\s*드립니다|합니다)/,
  /이\s*글\s*하나로/,
  /궁금하셨다면/,
  /완벽(?:하게|한)?/,
  /무조건/,
  /최고(?:의|로)?/,
  /합리적인\s*비용/,
  /전문\s*(?:업체|시공)/,
  /(?:^|[.!?]\s*)(?:문|문제|작업|결과)\s*:/,
  /[\u{1F1E6}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
];

function createSummarySchema(paragraphCount) {
  const paragraphNumber = { type: "integer", minimum: 1, maximum: paragraphCount };
  return {
    type: "object",
    additionalProperties: false,
    required: ["summary", "summarySourceParagraphs", "highlights"],
    properties: {
      summary: { type: "string", minLength: 45, maxLength: 220 },
      summarySourceParagraphs: {
        type: "array",
        minItems: 1,
        maxItems: 5,
        items: paragraphNumber,
      },
      highlights: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["kind", "text", "sourceParagraphs"],
          properties: {
            kind: { type: "string", enum: ["problem", "work", "result"] },
            text: { type: "string", minLength: 15, maxLength: 160 },
            sourceParagraphs: {
              type: "array",
              minItems: 1,
              maxItems: 4,
              items: paragraphNumber,
            },
          },
        },
      },
    },
  };
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(value) {
  return normalizeText(value).toLocaleLowerCase("ko-KR").replace(/[^0-9a-z가-힣]/gi, "");
}

function bigrams(value) {
  const compact = compactText(value);
  const result = new Set();
  for (let index = 0; index < compact.length - 1; index += 1) result.add(compact.slice(index, index + 2));
  return result;
}

function hasEvidenceOverlap(text, evidence) {
  const outputBigrams = bigrams(text);
  const evidenceBigrams = bigrams(evidence);
  if (!outputBigrams.size || !evidenceBigrams.size) return false;
  let overlap = 0;
  for (const pair of outputBigrams) if (evidenceBigrams.has(pair)) overlap += 1;
  return overlap >= 4 && overlap / outputBigrams.size >= 0.08;
}

function extractProtectedFacts(value) {
  const normalized = normalizeText(value);
  return [
    ...(normalized.match(/\b[A-Z]{1,6}[A-Z0-9]*[- ]?\d{2,}[A-Z0-9-]*\b/gi) ?? []),
    ...(normalized.match(/\d[\d,.]*(?:\s*[~～-]\s*\d[\d,.]*)?\s*(?:원|만원|분|시간|년|개월|회|차|층|mm|cm)?/gi) ?? []),
  ].map(compactText).filter((value) => value.length >= 2);
}

function responseText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text;
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function evidenceFor(paragraphNumbers, paragraphs) {
  return paragraphNumbers.map((number) => paragraphs[number - 1]).filter(Boolean).join(" ");
}

export function needsEditorialRepair(post) {
  return [post?.summary, ...(post?.highlights ?? [])]
    .map(normalizeText)
    .some((text) => forbiddenCopy.some((pattern) => pattern.test(text)));
}

export function validateEditorialSummary(candidate, sourceParagraphs) {
  const errors = [];
  const paragraphs = sourceParagraphs.map(normalizeText).filter(Boolean);
  if (!candidate || typeof candidate !== "object") return { valid: false, errors: ["응답이 JSON 객체가 아닙니다."] };

  const summary = normalizeText(candidate.summary);
  if (summary.length < 45 || summary.length > 220) errors.push("요약 길이가 허용 범위를 벗어났습니다.");
  if (summary.includes("\n")) errors.push("요약에 줄바꿈이 포함됐습니다.");
  if (forbiddenCopy.some((pattern) => pattern.test(summary))) errors.push("요약에 광고성·자동 생성형 표현이 포함됐습니다.");

  const summarySources = Array.isArray(candidate.summarySourceParagraphs) ? candidate.summarySourceParagraphs : [];
  if (summarySources.length < 1 || summarySources.length > 5) errors.push("요약의 원문 근거가 올바르지 않습니다.");
  if (summarySources.some((number) => !Number.isInteger(number) || number < 1 || number > paragraphs.length)) {
    errors.push("요약이 존재하지 않는 원문 문단을 참조했습니다.");
  } else if (!hasEvidenceOverlap(summary, evidenceFor(summarySources, paragraphs))) {
    errors.push("요약과 지정된 원문 근거의 연관성이 부족합니다.");
  }

  const highlights = Array.isArray(candidate.highlights) ? candidate.highlights : [];
  if (highlights.length !== 3) errors.push("핵심 내용은 정확히 세 개여야 합니다.");
  const expectedKinds = ["problem", "work", "result"];
  highlights.forEach((highlight, index) => {
    const text = normalizeText(highlight?.text);
    const sources = Array.isArray(highlight?.sourceParagraphs) ? highlight.sourceParagraphs : [];
    if (highlight?.kind !== expectedKinds[index]) errors.push(`핵심 내용 ${index + 1}의 순서가 올바르지 않습니다.`);
    if (text.length < 15 || text.length > 160) errors.push(`핵심 내용 ${index + 1}의 길이가 허용 범위를 벗어났습니다.`);
    if (forbiddenCopy.some((pattern) => pattern.test(text))) errors.push(`핵심 내용 ${index + 1}에 광고성 표현이 포함됐습니다.`);
    if (sources.length < 1 || sources.length > 4 || sources.some((number) => !Number.isInteger(number) || number < 1 || number > paragraphs.length)) {
      errors.push(`핵심 내용 ${index + 1}의 원문 근거가 올바르지 않습니다.`);
    } else if (!hasEvidenceOverlap(text, evidenceFor(sources, paragraphs))) {
      errors.push(`핵심 내용 ${index + 1}과 지정된 원문 근거의 연관성이 부족합니다.`);
    }
  });

  const sourceFacts = new Set(extractProtectedFacts(paragraphs.join(" ")));
  const outputFacts = extractProtectedFacts([summary, ...highlights.map((highlight) => highlight?.text)].join(" "));
  const inventedFacts = outputFacts.filter((fact) => !sourceFacts.has(fact));
  if (inventedFacts.length) errors.push(`원문에서 확인되지 않는 숫자나 모델명이 있습니다: ${inventedFacts.join(", ")}`);

  return {
    valid: errors.length === 0,
    errors,
    value: errors.length ? undefined : {
      summary,
      highlights: highlights.map((highlight) => normalizeText(highlight.text)),
      evidence: {
        summary: [...new Set(summarySources)],
        highlights: highlights.map((highlight) => [...new Set(highlight.sourceParagraphs)]),
      },
    },
  };
}

function createPrompt(post) {
  const paragraphs = post.content.map(normalizeText).filter(Boolean);
  const source = paragraphs.map((paragraph, index) => `[${index + 1}] ${paragraph}`).join("\n");
  return {
    paragraphs,
    input: `다음은 꼼꼼욕실이 직접 작성한 네이버 블로그 시공 기록입니다. 이 원문만 근거로 홈페이지용 문구를 작성하세요.\n\n제목: ${post.title}\n지역: ${post.area || "원문에서 확인"}\n시공 항목: ${post.service || "원문에서 확인"}\n제품: ${post.product || "원문에서 확인"}\n\n원문 문단:\n${source}`,
  };
}

async function requestSummary({ apiKey, model, input, paragraphCount, fetchImpl }) {
  const response = await fetchImpl(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      reasoning: { effort: "minimal" },
      max_output_tokens: 2_400,
      instructions: [
        "당신은 욕실 시공 기록을 고객이 이해하기 쉬운 한국어로 다듬는 편집자입니다.",
        "원문에 명시된 사실만 사용하고 일반적인 장점, 추정, 과장, 보증을 추가하지 마세요.",
        "요약은 고객의 불편 또는 요청, 실제 작업, 확인된 결과가 자연스럽게 이어지는 2~3문장으로 작성하세요.",
        "summary 문장에 '문:', '문제:', '작업:', '결과:' 같은 제목이나 구분 표시를 붙이지 마세요.",
        "블로그, 글, 포스팅, 확인해 보세요 같은 매체 안내나 광고 문구를 쓰지 마세요.",
        "핵심 내용은 problem, work, result 순서로 각각 한 문장씩 작성하세요.",
        `각 문장에 근거가 된 원문 문단 번호를 1부터 ${paragraphCount} 사이에서 정확히 기록하세요.`,
        "문단 번호는 sourceParagraphs 필드에만 넣고 summary와 text 문장에는 쓰지 마세요.",
        "원문에 결과가 명확하지 않으면 완료 후 점검한 사실까지만 쓰고 효과를 만들어내지 마세요.",
      ].join("\n"),
      input,
      text: {
        format: {
          type: "json_schema",
          name: "construction_case_summary",
          strict: true,
          schema: createSummarySchema(paragraphCount),
        },
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const details = normalizeText(await response.text()).slice(0, 500);
    const error = new Error(`OpenAI ${model} 요청 실패 (${response.status}): ${details}`);
    error.fatal = response.status === 401 || response.status === 403;
    throw error;
  }
  const payload = await response.json();
  const text = responseText(payload);
  const responseState = payload?.incomplete_details?.reason || payload?.status || "unknown";
  if (!text) throw new Error(`OpenAI ${model} 응답에 출력 텍스트가 없습니다. 상태: ${responseState}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`OpenAI ${model} 응답을 JSON으로 해석할 수 없습니다. 상태: ${responseState}`);
  }
}

export async function generateEditorialSummary(post, options = {}) {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, reason: "missing-api-key", attempts: [] };
  const primaryModel = options.primaryModel || process.env.OPENAI_SUMMARY_MODEL || DEFAULT_PRIMARY_MODEL;
  const fallbackModel = options.fallbackModel || process.env.OPENAI_SUMMARY_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;
  const models = [...new Set([primaryModel, fallbackModel].filter(Boolean))];
  const fetchImpl = options.fetchImpl || fetch;
  const { paragraphs, input } = createPrompt(post);
  const attempts = [];

  for (const model of models) {
    try {
      const candidate = await requestSummary({ apiKey, model, input, paragraphCount: paragraphs.length, fetchImpl });
      const validation = validateEditorialSummary(candidate, paragraphs);
      if (validation.valid) return { ok: true, model, attempts, ...validation.value };
      attempts.push({ model, errors: validation.errors });
    } catch (error) {
      if (error.fatal) throw error;
      attempts.push({ model, errors: [error.message] });
    }
  }
  return { ok: false, reason: "validation-failed", attempts };
}
