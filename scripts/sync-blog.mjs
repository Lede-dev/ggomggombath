import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RSS_URL = "https://rss.blog.naver.com/refresh-bath.xml";
const WORKS_CATEGORY = "시공후기";
const WORKS_CATEGORY_URL = "https://blog.naver.com/PostList.naver?blogId=refresh-bath&categoryNo=9&from=postList&parentCategoryNo=9";
const SITE_URL = "https://ggomggombath.com";
const SITE_UPDATED_AT = "2026-07-21";
const POSTS_LIMIT = 10;
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const postsPath = resolve(rootDir, "data/blog-posts.json");
const statsPath = resolve(rootDir, "data/blog-stats.json");
const sitemapPath = resolve(rootDir, "public/sitemap.xml");
const siteRssPath = resolve(rootDir, "public/rss.xml");
const llmsPath = resolve(rootDir, "public/llms.txt");

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

function readTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

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

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { display: value, iso: SITE_UPDATED_AT };
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value ?? "";
  return {
    display: `${part("year")}.${part("month")}.${part("day")}`,
    iso: `${part("year")}-${part("month")}-${part("day")}`,
  };
}

function extractProduct(title) {
  return title.match(/(?:대림바스|이바스|대림도비도스|하츠|이누스)\s+(?:[A-Z]{2,4}-?\d+[A-Z]?|IC\d+E?)/i)?.[0] ?? "현장 규격에 맞는 양변기";
}

function extractIssues(title, excerpt) {
  const source = `${title} ${excerpt}`;
  const candidates = ["깨짐", "막힘", "물내림", "냄새", "누수", "고장", "노후"];
  const labels = { 깨짐: "도기 파손", 막힘: "반복 막힘", 물내림: "물내림 저하", 냄새: "욕실 냄새", 누수: "누수", 고장: "제품 고장", 노후: "제품 노후" };
  const issues = candidates.filter((keyword) => source.includes(keyword)).map((keyword) => labels[keyword]);
  return issues.length ? [...new Set(issues)] : ["노후 제품 교체"];
}

function parsePosts(xml) {
  return (xml.match(/<item>[\s\S]*?<\/item>/gi) ?? []).slice(0, POSTS_LIMIT).map((block) => {
    const description = readTag(block, "description");
    const excerptText = stripMarkup(description.replace(/<img[\s\S]*$/i, ""));
    const title = decodeEntities(readTag(block, "title"));
    const link = readTag(block, "link").replace(/\?.*$/, "");
    const id = link.match(/(\d+)\/?$/)?.[1] ?? "";
    const date = formatDate(readTag(block, "pubDate"));
    const area = title.match(/^(.+?)\s+변기교체/)?.[1] ?? "서울·인천·경기";

    return {
      id,
      title,
      link,
      date: date.display,
      dateIso: date.iso,
      category: decodeEntities(readTag(block, "category")) || WORKS_CATEGORY,
      image: decodeEntities(description.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? ""),
      images: [],
      excerpt: excerptText.length > 320 ? `${excerptText.slice(0, 320).trim()}…` : excerptText,
      content: [],
      area,
      product: extractProduct(title),
      issues: extractIssues(title, excerptText),
    };
  });
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

function parseCompletedWorks(html) {
  const normalized = html.replace(/\s+/g, " ");
  const escapedCategory = WORKS_CATEGORY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = normalized.match(new RegExp(`<strong[^>]*>\\s*${escapedCategory}\\s*<\\/strong>.{0,100}?([\\d,]+)개의\\s*글`, "i"));
  const count = Number.parseInt(match?.[1]?.replaceAll(",", "") ?? "", 10);
  if (!Number.isInteger(count) || count < 1) throw new Error("Naver category page did not contain the completed works count");
  return count;
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function createSitemap(posts) {
  const staticEntries = staticRoutes.map((route) => `  <url>\n    <loc>${SITE_URL}${route.path}</loc>\n    <lastmod>${SITE_UPDATED_AT}</lastmod>\n    <changefreq>${route.frequency}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`);
  const workEntries = posts.map((post) => `  <url>\n    <loc>${SITE_URL}/works/${post.id}</loc>\n    <lastmod>${post.dateIso}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.7</priority>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticEntries, ...workEntries].join("\n")}\n</urlset>\n`;
}

function createRss(posts) {
  const items = posts.map((post) => `    <item>\n      <title>${escapeXml(post.title)}</title>\n      <link>${SITE_URL}/works/${post.id}</link>\n      <guid>${SITE_URL}/works/${post.id}</guid>\n      <pubDate>${new Date(`${post.dateIso}T12:00:00+09:00`).toUTCString()}</pubDate>\n      <description>${escapeXml(post.excerpt)}</description>\n    </item>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>꼼꼼욕실 시공 사례</title>\n    <link>${SITE_URL}/works</link>\n    <description>서울·인천·경기 욕실 부분시공 실제 사례</description>\n    <language>ko-KR</language>\n${items}\n  </channel>\n</rss>\n`;
}

function createLlms(posts) {
  const workLinks = posts.slice(0, 5).map((post) => `- [${post.title}](${SITE_URL}/works/${post.id})`).join("\n");
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

const requestHeaders = { "User-Agent": "GGomGgomBathBuildSync/2.0" };
const [rssResponse, categoryResponse] = await Promise.all([
  fetch(RSS_URL, { headers: requestHeaders }),
  fetch(WORKS_CATEGORY_URL, { headers: requestHeaders }),
]);
if (!rssResponse.ok) throw new Error(`Naver RSS returned ${rssResponse.status}`);
if (!categoryResponse.ok) throw new Error(`Naver category page returned ${categoryResponse.status}`);

const [rssXml, categoryHtml] = await Promise.all([rssResponse.text(), categoryResponse.text()]);
const posts = parsePosts(rssXml);
if (posts.length < POSTS_LIMIT || posts.some((post) => !post.id)) throw new Error("Naver RSS did not contain enough valid construction posts");

const enrichedPosts = await Promise.all(posts.map(async (post) => {
  const response = await fetch(`https://m.blog.naver.com/refresh-bath/${post.id}`, { headers: requestHeaders });
  if (!response.ok) return post;
  const detail = parsePostContent(await response.text(), post.title);
  return { ...post, ...detail, image: detail.images[0] ?? post.image };
}));

const stats = {
  completedWorks: parseCompletedWorks(categoryHtml),
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
console.log(changes.some(Boolean) ? "Latest blog and discovery data updated." : "Latest blog and discovery data is already current.");
