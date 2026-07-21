import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EDITORIAL_VERSION, generateEditorialSummary } from "./editorial-summary.mjs";

const BLOG_ID = "refresh-bath";
const WORKS_CATEGORY = "시공후기";
const WORKS_CATEGORY_NO = 9;
const WORKS_CATEGORY_URL = "https://blog.naver.com/PostList.naver?blogId=refresh-bath&categoryNo=9&from=postList&parentCategoryNo=9";
const WORKS_LIST_URL = "https://blog.naver.com/PostTitleListAsync.naver";
const SITE_URL = "https://ggomggombath.com";
const SITE_UPDATED_AT = "2026-07-21";
const SYNC_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const LIST_PAGE_SIZE = 30;
const DETAIL_CONCURRENCY = 2;
const REQUEST_INTERVAL_MS = 650;
const RSS_ITEMS_LIMIT = 20;
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const postsPath = resolve(rootDir, "data/blog-posts.json");
const statsPath = resolve(rootDir, "data/blog-stats.json");
const sitemapPath = resolve(rootDir, "public/sitemap.xml");
const siteRssPath = resolve(rootDir, "public/rss.xml");
const llmsPath = resolve(rootDir, "public/llms.txt");
let aiGeneratedCount = 0;
let aiFallbackCount = 0;
let reviewRequiredCount = 0;

const staticRoutes = [
  { path: "/", priority: "1.0", frequency: "weekly" },
  { path: "/services", priority: "0.9", frequency: "monthly" },
  { path: "/services/toilet-replacement", priority: "0.9", frequency: "monthly" },
  { path: "/services/washbasin-replacement", priority: "0.8", frequency: "monthly" },
  { path: "/services/faucet-replacement", priority: "0.8", frequency: "monthly" },
  { path: "/services/bathroom-cabinet", priority: "0.8", frequency: "monthly" },
  { path: "/works", priority: "0.9", frequency: "weekly" },
  { path: "/about", priority: "0.7", frequency: "monthly" },
  { path: "/process", priority: "0.7", frequency: "monthly" },
  { path: "/faq", priority: "0.7", frequency: "monthly" },
];

function decodeEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function stripMarkup(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatNaverDate(value) {
  const match = value.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./);
  if (!match) return { display: value, iso: SITE_UPDATED_AT };
  const [, year, rawMonth, rawDay] = match;
  const month = rawMonth.padStart(2, "0");
  const day = rawDay.padStart(2, "0");
  return {
    display: `${year}.${month}.${day}`,
    iso: `${year}-${month}-${day}`,
  };
}

function extractProduct(title) {
  return title.match(/(?:대림바스|이바스|대림도비도스|하츠|이누스|아메리칸스탠다드|한샘바스|인토)\s*(?:[A-Z]{2,4}-?\d+[A-Z]?|IC\d+E?)/i)?.[0].replace(/([가-힣])([A-Z])/i, "$1 $2") ?? "";
}

function extractIssues(title, excerpt) {
  const source = `${title} ${excerpt}`;
  const rules = [
    [/깨짐|깨진|파손/, "도기 파손"],
    [/막힘|막힌/, "반복 막힘"],
    [/물내림/, "물내림 저하"],
    [/냄새|악취/, "욕실 냄새"],
    [/누수|물샘/, "누수"],
    [/고장/, "제품 고장"],
    [/노후/, "제품 노후"],
  ];
  const issues = rules.filter(([pattern]) => pattern.test(source)).map(([, label]) => label);
  return [...new Set(issues)];
}

function extractService(title, content = []) {
  const detect = (source) => {
    const hasToilet = /변기|양변기/.test(source);
    const hasBasin = /세면대|세면기/.test(source);
    if (hasToilet && hasBasin) return "양변기·세면기 교체";
    if (hasToilet) return "양변기 교체";
    if (hasBasin) return "세면기 교체";
    if (/수전|샤워기|샤워 수전/.test(source)) return "수전·샤워 교체";
    if (/욕실장|거울장|슬라이드장/.test(source)) return "욕실장·거울 교체";
    return "";
  };
  const titleService = detect(title);
  if (titleService) return titleService;
  const contentService = detect(content.slice(0, 12).join(" "));
  if (contentService) return contentService;
  return "욕실 부분시공";
}

function extractArea(title) {
  const normalized = title
    .replace(/^\[(?:꼼꼼시공|꼼꼼욕실)\]\s*/, "")
    .replace(/^\[/, "");
  return normalized.match(/^([가-힣]+?)(?:\s+)?(?:변기|양변기|세면대|세면기|수전|샤워기|욕실장|거울)/)?.[1]
    ?? title.match(/^([^\s｜|]+)/)?.[1]?.replace(/[\[\]]/g, "")
    ?? "서울·인천·경기";
}

function extractSiteLabel(title, area) {
  let detail = title.includes("｜") || title.includes("|")
    ? title.split(/[｜|]/).slice(1).join(" ")
    : title.replace(/^(?:\s*\[[^\]]+\])+\s*/, "");
  const escapedArea = area.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  detail = detail
    .replace(new RegExp(`^${escapedArea}(?=\\s|$)\\s*`), "")
    .replace(new RegExp(`^(?:${escapedArea})?(?:변기|양변기|세면대|세면기|수전|샤워기|욕실장|거울)\\s*(?:교체|시공)\\s*`, "i"), "")
    .replace(/^[,·\s]+/, "")
    .replace(/^(?:(?:변기|양변기|세면대|세면기|수전|샤워기|욕실장|거울)\s*(?:교체|시공)\s*(?:후기|사례|시공)?\s*[,·]?\s*)+/i, "");
  const productMarker = detail.search(/(?:대림바스|이바스|대림도비도스|하츠|이누스|아메리칸스탠다드|한샘바스|인토)|\b(?:[A-Z]{2,4}-?\d+[A-Z]?|IC\d+E?)\b/i);
  if (productMarker > 0) detail = detail.slice(0, productMarker);
  detail = detail
    .replace(/\s+(?:노후(?:되고|된)?|깨진|깨짐|파손(?:된)?|금가있는|금이\s*간|막힌|막힘|수압\s*(?:약한|문제로)|답답한\s*물내림|고장난|(?:부속|변기|제품)고장(?:으로)?|비데일체형변기\s*고장(?:으로)?).*$/i, "")
    .replace(/\s+(?:치마형)?(?:양)?변기(?:교체|설치|시공)?.*$/i, "")
    .replace(/\s+세면대(?:교체|설치|시공)?.*$/i, "")
    .replace(/\s+(?:투피스|원피스|치마형)?\s*(?:양)?변기\s*(?:교체|설치|시공).*$/i, "")
    .replace(/[·｜|]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return detail.length > 48 ? `${detail.slice(0, 48).trim()}…` : detail;
}

function createLocationLabel(area, siteLabel) {
  if (!siteLabel) return area;
  if (!siteLabel.startsWith(area)) return `${area} ${siteLabel}`;
  const remainder = siteLabel.slice(area.length);
  if (!remainder || /^\s/.test(remainder) || /^(?:구|시|군)/.test(remainder)) return siteLabel;
  return `${area} ${remainder}`;
}

function createDisplayTitle(area, siteLabel, service, product) {
  const location = createLocationLabel(area, siteLabel);
  return [location, service, product].filter(Boolean).join(" | ");
}

function mergeSourceParagraphs(content) {
  const merged = [];
  let buffer = "";
  const flush = () => {
    const value = buffer.replace(/\s+/g, " ").trim();
    if (value) merged.push(value);
    buffer = "";
  };

  for (const rawParagraph of content) {
    const paragraph = rawParagraph.replace(/[✅📌■▶✔]/gu, " ").replace(/꼼꼼욕실/g, " ").replace(/\s+/g, " ").trim();
    if (!paragraph || /^#/.test(paragraph)) continue;
    const looksLikeHeading = paragraph.length < 34 && /(이유|증상|과정|완료|제품|교체|시공|마무리|안내)$/.test(paragraph);
    if (looksLikeHeading) {
      flush();
      continue;
    }
    buffer = buffer ? `${buffer} ${paragraph}` : paragraph;
    if (/[.!?]$/.test(paragraph) || /(?:니다|습니다|됩니다|세요|했어요|있어요)$/.test(paragraph) || buffer.length >= 150) flush();
  }
  flush();
  return merged;
}

function selectSourceHighlights(content, area, product) {
  const candidates = mergeSourceParagraphs(content)
    .filter((paragraph) => paragraph.length >= 35 && paragraph.length <= 260)
    .filter((paragraph) => !/(안녕하세요|010-2939-2537|상담 문의|문의 주세요|감사합니다|꼼꼼욕실입니다)/.test(paragraph));
  const specificityScore = (paragraph) => {
    let score = 0;
    if (/이번 사례|이번 현장|해당 현장|고객님|요청하신|작업 현장|시공 현장/.test(paragraph)) score += 8;
    if (product && paragraph.includes(product)) score += 5;
    if (area && paragraph.includes(area)) score += 3;
    if (/아파트|오피스텔|주택|상가/.test(paragraph)) score += 2;
    if (/문의가 많|고려해|일반적으로|특히 아래|단순 뚫음/.test(paragraph)) score -= 5;
    return score;
  };
  const rankedCandidates = [...candidates].sort((a, b) => specificityScore(b) - specificityScore(a));
  const groups = [
    /깨짐|막힘|물내림|냄새|누수|고장|노후|문제|교체 문의|교체 요청/,
    /철거|설치|교체|배관|수평|백시멘트|실리콘|플랜지|부속/,
    /완료|마무리|테스트|확인|정상|검수|물내림/,
  ];
  const selected = [];
  for (const pattern of groups) {
    const match = rankedCandidates.find((paragraph) => pattern.test(paragraph) && !selected.includes(paragraph));
    if (match) selected.push(match);
  }
  for (const paragraph of rankedCandidates) {
    if (selected.length >= 3) break;
    if (!selected.includes(paragraph)) selected.push(paragraph);
  }
  return selected.slice(0, 3);
}

function createSourceHash(post) {
  return createHash("sha256").update(JSON.stringify([post.title, post.content, post.images])).digest("hex");
}

async function applyEditorialProcessing(post, previous) {
  const sourceHash = createSourceHash(post);
  const sourceUnchanged = previous && createSourceHash(previous) === sourceHash;
  const hasCurrentAiSummary = sourceUnchanged
    && previous.editorialVersion === EDITORIAL_VERSION
    && previous.editorialMode === "ai-grounded"
    && previous.editorialStatus === "approved";
  if (hasCurrentAiSummary) return previous;
  if (!process.env.OPENAI_API_KEY && sourceUnchanged) return previous;

  const service = extractService(post.title, post.content);
  const area = extractArea(post.title);
  const siteLabel = extractSiteLabel(post.title, area);
  const product = extractProduct(post.title);
  const issues = extractIssues(post.title, post.excerpt || "");
  const fallbackHighlights = selectSourceHighlights(post.content, area, product);
  const reasonText = issues.length ? `${issues.slice(0, 2).join("·")} 문제로 ` : "";
  const productText = product ? `${product} 설치 모습과 ` : "";
  const location = createLocationLabel(area, siteLabel);
  const fallbackSummary = `${location}에서 ${reasonText}진행한 ${service} 현장입니다. ${productText}시공 전후 상태와 실제 작업 과정을 정리했습니다.`;
  const baseQuality = area !== "서울·인천·경기" && service !== "욕실 부분시공" && fallbackHighlights.length >= 2 && post.images.length >= 1
    ? "indexable"
    : "source-only";
  const displayTitle = createDisplayTitle(area, siteLabel, service, product);
  const basePost = {
    ...post,
    area,
    siteLabel,
    service,
    product,
    issues,
    displayTitle,
    seoTitle: displayTitle,
    sourceHash,
  };

  if (process.env.OPENAI_API_KEY) {
    const generated = await generateEditorialSummary(basePost);
    if (generated.ok) {
      aiGeneratedCount += 1;
      if (generated.model !== (process.env.OPENAI_SUMMARY_MODEL || "gpt-5-nano")) aiFallbackCount += 1;
      return {
        ...basePost,
        excerpt: generated.summary,
        summary: generated.summary,
        highlights: generated.highlights,
        summaryEvidence: generated.evidence,
        summaryModel: generated.model,
        processedAt: SYNC_DATE,
        editorialMode: "ai-grounded",
        editorialVersion: EDITORIAL_VERSION,
        editorialStatus: "approved",
        quality: baseQuality,
      };
    }

    const attemptSummary = generated.attempts
      .map((attempt) => `${attempt.model}: ${attempt.errors.join(" / ")}`)
      .join(" | ");
    console.warn(`AI editorial review failed for Naver post ${post.id}. ${attemptSummary}`);
    if (sourceUnchanged && previous) return previous;
  }

  reviewRequiredCount += 1;

  return {
    ...basePost,
    excerpt: fallbackSummary,
    summary: fallbackSummary,
    highlights: fallbackHighlights,
    processedAt: SYNC_DATE,
    editorialMode: "source-derived",
    editorialVersion: EDITORIAL_VERSION,
    editorialStatus: "review-required",
    quality: "source-only",
  };
}

function decodeNaverValue(value) {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return decodeEntities(value.replace(/\+/g, " "));
  }
}

function parsePostListResponse(source) {
  const marker = '"postList":';
  const start = source.indexOf(marker);
  const end = source.indexOf('],"countPerPage"', start);
  if (start < 0 || end < 0) throw new Error("Naver post list response was not recognized");

  const postList = JSON.parse(source.slice(start + marker.length, end + 1));
  const totalCount = Number.parseInt(source.match(/"totalCount":"?(\d+)"?/)?.[1] ?? "", 10);
  if (!Number.isInteger(totalCount) || totalCount < 1) throw new Error("Naver post list did not contain a valid total count");
  return { postList, totalCount };
}

function summarizeContent(content, fallback) {
  const text = content.join(" ").replace(/\s+/g, " ").trim() || fallback;
  return text.length > 320 ? `${text.slice(0, 320).trim()}…` : text;
}

function createPost(record, previous) {
  const title = decodeNaverValue(record.title);
  const date = formatNaverDate(record.addDate);
  const content = Array.isArray(previous?.content) ? previous.content : [];
  const images = Array.isArray(previous?.images) ? previous.images : [];
  const excerpt = previous?.excerpt || summarizeContent(content, title);

  return {
    id: record.logNo,
    title,
    link: `https://blog.naver.com/${BLOG_ID}/${record.logNo}`,
    date: date.display,
    dateIso: date.iso,
    category: WORKS_CATEGORY,
    image: previous?.image ?? images[0] ?? "",
    images,
    excerpt,
    content,
    area: extractArea(title),
    service: extractService(title, content),
    product: extractProduct(title),
    issues: extractIssues(title, excerpt),
  };
}

function parsePostContent(html, title) {
  const content = [...html.matchAll(/<p[^>]*class="[^"]*se-text-paragraph[^"]*"[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripMarkup(match[1]))
    .filter((paragraph) => paragraph && paragraph !== title && !/^#/.test(paragraph));

  const deduplicated = content.filter((paragraph, index) => paragraph !== content[index - 1]);
  const imageCandidates = [...html.matchAll(/(?:data-lazy-src|src)="(https?:\/\/[^\"]+)"/gi)]
    .map((match) => decodeEntities(match[1]))
    .filter((source) => /mblogthumb-phinf\.pstatic\.net/.test(source) && !/w80_blur/.test(source));
  const imageKeys = new Set();
  const images = imageCandidates.filter((source) => {
    const key = source.replace(/\?.*$/, "");
    if (imageKeys.has(key)) return false;
    imageKeys.add(key);
    return true;
  }).slice(0, 8);

  return { content: deduplicated.slice(0, 80), images };
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }));
  return results;
}

let nextRequestAt = 0;
async function waitForRequestSlot() {
  const now = Date.now();
  const requestAt = Math.max(now, nextRequestAt);
  nextRequestAt = requestAt + REQUEST_INTERVAL_MS;
  if (requestAt > now) await new Promise((resolveDelay) => setTimeout(resolveDelay, requestAt - now));
}

async function fetchText(url, label) {
  let lastStatus = 0;
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    await waitForRequestSlot();
    try {
      const response = await fetch(url, { headers: requestHeaders, signal: AbortSignal.timeout(20_000) });
      lastStatus = response.status;
      if (response.ok) return response.text();
      if (attempt < 5) {
        const retryDelay = response.status === 429 ? attempt * 5_000 : attempt * 800;
        await new Promise((resolveDelay) => setTimeout(resolveDelay, retryDelay));
      }
    } catch (error) {
      lastError = error;
      if (attempt < 5) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 1_000));
    }
  }
  throw new Error(`${label} returned ${lastStatus || lastError?.message || "a network error"}`);
}

function createListUrl(page) {
  const url = new URL(WORKS_LIST_URL);
  url.searchParams.set("blogId", BLOG_ID);
  url.searchParams.set("viewdate", "");
  url.searchParams.set("currentPage", String(page));
  url.searchParams.set("categoryNo", String(WORKS_CATEGORY_NO));
  url.searchParams.set("parentCategoryNo", String(WORKS_CATEGORY_NO));
  url.searchParams.set("countPerPage", String(LIST_PAGE_SIZE));
  return url;
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function createSitemap(posts) {
  const staticEntries = staticRoutes.map((route) => `  <url>\n    <loc>${SITE_URL}${route.path}</loc>\n    <lastmod>${SITE_UPDATED_AT}</lastmod>\n    <changefreq>${route.frequency}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`);
  const workEntries = posts.filter((post) => post.quality === "indexable").map((post) => `  <url>\n    <loc>${SITE_URL}/works/${post.id}</loc>\n    <lastmod>${post.processedAt || post.dateIso}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.7</priority>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticEntries, ...workEntries].join("\n")}\n</urlset>\n`;
}

function createRss(posts) {
  const items = posts.slice(0, RSS_ITEMS_LIMIT).map((post) => `    <item>\n      <title>${escapeXml(post.displayTitle)}</title>\n      <link>${SITE_URL}/works/${post.id}</link>\n      <guid>${SITE_URL}/works/${post.id}</guid>\n      <pubDate>${new Date(`${post.dateIso}T12:00:00+09:00`).toUTCString()}</pubDate>\n      <description>${escapeXml(post.summary)}</description>\n    </item>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>꼼꼼욕실 시공 사례</title>\n    <link>${SITE_URL}/works</link>\n    <description>서울·인천·경기 욕실 부분시공 실제 사례</description>\n    <language>ko-KR</language>\n${items}\n  </channel>\n</rss>\n`;
}

function createLlms(posts) {
  const workLinks = posts.slice(0, 5).map((post) => `- [${post.displayTitle}](${SITE_URL}/works/${post.id})`).join("\n");
  return `# 꼼꼼욕실\n\n> 서울·인천·경기 지역의 욕실 부분시공 및 욕실 제품 교체 전문 서비스입니다.\n\n## 핵심 페이지\n- [서비스 안내](${SITE_URL}/services)\n- [양변기 교체](${SITE_URL}/services/toilet-replacement)\n- [세면기 교체](${SITE_URL}/services/washbasin-replacement)\n- [수전·샤워 교체](${SITE_URL}/services/faucet-replacement)\n- [욕실장·거울 교체](${SITE_URL}/services/bathroom-cabinet)\n- [시공 사례](${SITE_URL}/works)\n- [진행 과정](${SITE_URL}/process)\n- [자주 묻는 질문](${SITE_URL}/faq)\n\n## 최근 실제 시공 사례\n${workLinks}\n\n## 공식 정보\n- 서비스 지역: 서울 전 지역, 인천광역시, 경기도\n- 전화 상담: 010-2939-2537\n- 네이버 블로그: https://blog.naver.com/refresh-bath\n- 유튜브: https://www.youtube.com/@%EA%BC%BC%EA%BC%BC%EC%9A%95%EC%8B%A4\n- 인스타그램: https://www.instagram.com/ggomggombath/\n\n서비스 범위와 시공 지역은 공식 홈페이지를, 사례의 상세 현장 기록은 각 페이지에 연결된 꼼꼼욕실 네이버 블로그 원문을 함께 참고해 주세요.\n`;
}

async function writeIfChanged(path, contents) {
  let previous = "";
  try {
    previous = await readFile(path, "utf8");
  } catch {
    await mkdir(dirname(path), { recursive: true });
  }
  if (previous === contents) return false;
  await writeFile(path, contents, "utf8");
  return true;
}

const requestHeaders = {
  "User-Agent": "Mozilla/5.0 (compatible; GgomGgomBathSync/3.0; +https://ggomggombath.com)",
  Referer: WORKS_CATEGORY_URL,
};
let previousPosts = [];
try {
  previousPosts = JSON.parse(await readFile(postsPath, "utf8"));
} catch {
  // The first sync starts without a local cache.
}
const previousById = new Map(previousPosts.map((post) => [post.id, post]));

const firstPage = parsePostListResponse(await fetchText(createListUrl(1), "Naver construction list"));
const pageCount = Math.ceil(firstPage.totalCount / LIST_PAGE_SIZE);
const remainingPages = await Promise.all(Array.from({ length: pageCount - 1 }, async (_, index) => {
  const page = index + 2;
  return parsePostListResponse(await fetchText(createListUrl(page), `Naver construction list page ${page}`)).postList;
}));
const records = [...firstPage.postList, ...remainingPages.flat()];
const uniqueRecords = records.filter((record, index) => records.findIndex((candidate) => candidate.logNo === record.logNo) === index);
if (uniqueRecords.length !== firstPage.totalCount || uniqueRecords.some((record) => !record.logNo)) {
  throw new Error(`Naver construction list expected ${firstPage.totalCount} posts but returned ${uniqueRecords.length}`);
}

let downloadedDetails = 0;
const posts = uniqueRecords.map((record) => createPost(record, previousById.get(record.logNo)));
const enrichedPosts = await mapWithConcurrency(posts, DETAIL_CONCURRENCY, async (post) => {
  const previous = previousById.get(post.id);
  if (post.content.length >= 3 && post.images.length >= 1) return applyEditorialProcessing(post, previous);

  const html = await fetchText(`https://m.blog.naver.com/${BLOG_ID}/${post.id}`, `Naver post ${post.id}`);
  const detail = parsePostContent(html, post.title);
  if (detail.content.length < 3 || detail.images.length < 1) throw new Error(`Naver post ${post.id} did not contain usable construction content`);
  downloadedDetails += 1;
  const excerpt = summarizeContent(detail.content, post.title);
  return applyEditorialProcessing({ ...post, ...detail, excerpt, image: detail.images[0], issues: extractIssues(post.title, excerpt) }, previous);
});
const displayTitleCounts = new Map();
for (const post of enrichedPosts) displayTitleCounts.set(post.displayTitle, (displayTitleCounts.get(post.displayTitle) ?? 0) + 1);
for (const post of enrichedPosts) {
  if (displayTitleCounts.get(post.displayTitle) > 1) post.seoTitle = `${post.displayTitle} (${post.date})`;
}

const stats = {
  completedWorks: firstPage.totalCount,
  sourceCategory: WORKS_CATEGORY,
  sourceUrl: WORKS_CATEGORY_URL,
};

const changes = await Promise.all([
  writeIfChanged(postsPath, `${JSON.stringify(enrichedPosts, null, 2)}\n`),
  writeIfChanged(statsPath, `${JSON.stringify(stats, null, 2)}\n`),
  writeIfChanged(sitemapPath, createSitemap(enrichedPosts)),
  writeIfChanged(siteRssPath, createRss(enrichedPosts)),
  writeIfChanged(llmsPath, createLlms(enrichedPosts)),
]);
const message = changes.some(Boolean) ? "All construction posts and discovery data updated." : "All construction posts and discovery data are already current.";
console.log(`${message} ${enrichedPosts.length} posts available; ${downloadedDetails} detail pages downloaded; ${aiGeneratedCount} AI summaries approved; ${aiFallbackCount} used the fallback model; ${reviewRequiredCount} require review.`);
