import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RSS_URL = "https://rss.blog.naver.com/refresh-bath.xml";
const SITE_URL = "https://ggomggombath.com";
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const postsPath = resolve(rootDir, "data/blog-posts.json");
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

const response = await fetch(RSS_URL, {
  headers: { "User-Agent": "GGomGgomBathBuildSync/1.0" },
});
if (!response.ok) throw new Error(`Naver RSS returned ${response.status}`);

const posts = parsePosts(await response.text());
if (posts.length === 0) throw new Error("Naver RSS did not contain any posts");

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
const sitemapChanged = await writeIfChanged(sitemapPath, sitemap);
console.log(postsChanged || sitemapChanged ? "Latest blog data updated." : "Latest blog data is already current.");
