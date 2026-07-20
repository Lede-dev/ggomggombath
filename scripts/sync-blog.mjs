import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RSS_URL = "https://rss.blog.naver.com/refresh-bath.xml";
const WORKS_CATEGORY = "시공후기";
const WORKS_CATEGORY_URL = "https://blog.naver.com/PostList.naver?blogId=refresh-bath&categoryNo=9&from=postList&parentCategoryNo=9";
const SITE_URL = "https://ggomggombath.com";
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const postsPath = resolve(rootDir, "data/blog-posts.json");
const statsPath = resolve(rootDir, "data/blog-stats.json");
const sitemapPath = resolve(rootDir, "public/sitemap.xml");

function readTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function stripMarkup(value) {
  return decodeEntities(
    value
      .replace(/<img[\s\S]*$/i, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}.${part("month")}.${part("day")}`;
}

function parsePosts(xml) {
  return (xml.match(/<item>[\s\S]*?<\/item>/gi) ?? []).slice(0, 3).map((block) => {
    const description = readTag(block, "description");
    const excerpt = stripMarkup(description);

    return {
      title: decodeEntities(readTag(block, "title")),
      link: readTag(block, "link").replace(/\?.*$/, ""),
      date: formatDate(readTag(block, "pubDate")),
      category: decodeEntities(readTag(block, "category")) || "시공후기",
      image: description.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? "",
      excerpt: excerpt.length > 112 ? `${excerpt.slice(0, 112).trim()}…` : excerpt,
    };
  });
}

function parseCompletedWorks(html) {
  const normalized = html.replace(/\s+/g, " ");
  const escapedCategory = WORKS_CATEGORY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = normalized.match(
    new RegExp(`<strong[^>]*>\\s*${escapedCategory}\\s*<\\/strong>.{0,100}?([\\d,]+)개의\\s*글`, "i"),
  );
  const count = Number.parseInt(match?.[1]?.replaceAll(",", "") ?? "", 10);
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("Naver category page did not contain the completed works count");
  }
  return count;
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

const requestHeaders = { "User-Agent": "GGomGgomBathBuildSync/1.0" };
const [rssResponse, categoryResponse] = await Promise.all([
  fetch(RSS_URL, { headers: requestHeaders }),
  fetch(WORKS_CATEGORY_URL, { headers: requestHeaders }),
]);
if (!rssResponse.ok) throw new Error(`Naver RSS returned ${rssResponse.status}`);
if (!categoryResponse.ok) throw new Error(`Naver category page returned ${categoryResponse.status}`);

const [rssXml, categoryHtml] = await Promise.all([rssResponse.text(), categoryResponse.text()]);
const posts = parsePosts(rssXml);
if (posts.length === 0) throw new Error("Naver RSS did not contain any posts");

const stats = {
  completedWorks: parseCompletedWorks(categoryHtml),
  sourceCategory: WORKS_CATEGORY,
  sourceUrl: WORKS_CATEGORY_URL,
};

const latestDate = posts[0].date.replaceAll(".", "-");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${latestDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

const postsChanged = await writeIfChanged(postsPath, `${JSON.stringify(posts, null, 2)}\n`);
const statsChanged = await writeIfChanged(statsPath, `${JSON.stringify(stats, null, 2)}\n`);
const sitemapChanged = await writeIfChanged(sitemapPath, sitemap);
console.log(postsChanged || statsChanged || sitemapChanged ? "Latest blog data updated." : "Latest blog data is already current.");
