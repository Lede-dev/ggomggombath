const KST_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toDateParts(date) {
  const parts = Object.fromEntries(KST_DATE_FORMATTER.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    display: `${parts.year}.${parts.month}.${parts.day}`,
    iso: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export function formatNaverDate(value, options = {}) {
  const normalized = String(value ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();
  const absolute = normalized.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?/);
  if (absolute) {
    const [, year, rawMonth, rawDay] = absolute;
    const month = rawMonth.padStart(2, "0");
    const day = rawDay.padStart(2, "0");
    return { display: `${year}.${month}.${day}`, iso: `${year}-${month}-${day}` };
  }

  const now = options.now instanceof Date ? options.now : new Date();
  let resolved = null;
  const relative = normalized.match(/(\d+)\s*(분|시간|일)\s*전/);
  if (/^(?:방금|조금)\s*전$/.test(normalized)) resolved = now;
  else if (/^어제$/.test(normalized)) resolved = new Date(now.getTime() - 86_400_000);
  else if (relative) {
    const amount = Number.parseInt(relative[1], 10);
    const unitMs = relative[2] === "분" ? 60_000 : relative[2] === "시간" ? 3_600_000 : 86_400_000;
    resolved = new Date(now.getTime() - amount * unitMs);
  }
  if (resolved) return toDateParts(resolved);

  if (/^\d{4}-\d{2}-\d{2}$/.test(options.previousIso ?? "")) {
    const [year, month, day] = options.previousIso.split("-");
    return { display: `${year}.${month}.${day}`, iso: options.previousIso };
  }
  return toDateParts(now);
}

const BRAND_PATTERN = /(?:대림바스|이바스|대림도비도스|하츠|이누스|아메리칸스탠다드|한샘바스|한샘\s*바스템|크린스|인토)/gi;
const MODEL_PATTERN = /\b(?:[A-Z]{1,5}(?:-[A-Z])?[- ]?\d{2,4}[A-Z]?|IC\d+E?)\b/gi;

function normalizeModel(value) {
  const normalized = value.toUpperCase().replace(/\s+/g, "-").replace(/-{2,}/g, "-");
  return normalized.includes("-") ? normalized : normalized.replace(/([A-Z])(?=\d)/, "$1-");
}

function modelMentions(value) {
  const normalized = String(value ?? "").normalize("NFKC");
  const brands = [...normalized.matchAll(BRAND_PATTERN)];
  const models = [...normalized.matchAll(MODEL_PATTERN)];
  return models.map((match) => {
    const model = normalizeModel(match[0]);
    const precedingBrand = [...brands]
      .filter((brand) => brand.index <= match.index && match.index - (brand.index + brand[0].length) <= 18)
      .at(-1)?.[0]
      ?.replace(/\s+/g, " ");
    return precedingBrand ? `${precedingBrand} ${model}` : model;
  });
}

function uniqueModels(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = value.replace(BRAND_PATTERN, "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function extractProduct(title, content = []) {
  const titleModels = uniqueModels(modelMentions(title));
  if (titleModels.length) return titleModels.slice(0, 3).join(" · ");

  const specificParagraphs = content
    .filter((paragraph) => /설치|교체|시공|제품|모델|변기|세면기|세면대|수전/.test(paragraph))
    .filter((paragraph) => !/추천 제품|제품 종류|선택 방법|문의가 많|가격 비교|어떤 제품/.test(paragraph))
    .slice(0, 30);
  return uniqueModels(specificParagraphs.flatMap(modelMentions)).slice(0, 3).join(" · ");
}

const ISSUE_RULES = [
  [/깨짐|깨진|깨져|파손|크랙|균열|금이\s*간/, "도기 파손"],
  [/막힘|막힌|역류/, "반복 막힘"],
  [/물내림|수세력|배수\s*성능|수압이\s*(?:약|좋지)/, "물내림 저하"],
  [/냄새|악취/, "욕실 냄새"],
  [/누수|물샘|물이\s*(?:새|나오)/, "누수"],
  [/고장|작동\s*불량/, "제품 고장"],
  [/노후|오랜\s*사용/, "제품 노후"],
];

function issueEvidenceParagraphs(content) {
  const starts = content
    .map((paragraph, index) => (
      /이번 현장.*(?:불편|요청)|고객.*(?:불편|요청|교체 사유)|교체 요청 사유|현장 점검 결과/.test(paragraph)
        && !/상당수|일반적|문의가 많/.test(paragraph)
        ? index
        : -1
    ))
    .filter((index) => index >= 0);

  const selected = [];
  for (const start of starts) {
    for (let index = start; index < Math.min(content.length, start + 12); index += 1) {
      const paragraph = content[index];
      if (index > start && /(?:욕실|변기|세면기).*교체 후|시공 과정|설치 후|비용 안내/.test(paragraph)) break;
      selected.push(paragraph);
    }
  }
  return [...new Set(selected)].slice(0, 24);
}

export function extractIssues(title, _excerpt = "", content = []) {
  void _excerpt;
  const source = [title, ...issueEvidenceParagraphs(content)].join(" ");
  return [...new Set(ISSUE_RULES.filter(([pattern]) => pattern.test(source)).map(([, label]) => label))];
}

export function assessCaseQuality(post) {
  const content = Array.isArray(post.content) ? post.content : [];
  const images = Array.isArray(post.images) ? post.images : [];
  const highlights = Array.isArray(post.highlights) ? post.highlights : [];
  const issues = Array.isArray(post.issues) ? post.issues : [];
  const workEvidenceCount = content.filter((paragraph) => /철거|설치|교체|배관|수평|실리콘|정심|누수|작동|테스트|점검/.test(paragraph)).length;
  const hasSpecificFact = Boolean(post.product) || issues.length > 0;
  const hasSpecificLocation = Boolean(post.area && post.area !== "서울·인천·경기" && post.siteLabel);
  const hasSpecificService = Boolean(post.service && post.service !== "욕실 부분시공");
  const hasEvidence = content.length >= 12 && images.length >= 3 && highlights.length === 3 && workEvidenceCount >= 2;
  const editorialReady = post.editorialStatus === "approved";
  return hasSpecificLocation && hasSpecificService && hasSpecificFact && hasEvidence && editorialReady
    ? "indexable"
    : "source-only";
}
