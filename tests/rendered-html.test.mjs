import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../dist/client/", import.meta.url);
const assetsConfigUrl = new URL("../wrangler.assets.jsonc", import.meta.url);
const globalStylesUrl = new URL("../app/globals.css", import.meta.url);
const blogStatsUrl = new URL("../data/blog-stats.json", import.meta.url);
const blogPostsUrl = new URL("../data/blog-posts.json", import.meta.url);
const faviconUrl = new URL("../public/favicon.svg", import.meta.url);
const darkFaviconUrl = new URL("../public/favicon-dark.svg", import.meta.url);
const logoUrl = new URL("../public/logo.svg", import.meta.url);

test("exports the homepage as a static asset", async () => {
  const [html, statsSource] = await Promise.all([
    readFile(new URL("index.html", outputRoot), "utf8"),
    readFile(blogStatsUrl, "utf8"),
  ]);
  const stats = JSON.parse(statsSource);
  const renderedText = html.replaceAll("<!-- -->", "");

  assert.match(html, /<title>[^<]*꼼꼼욕실<\/title>/);
  assert.match(html, /010-2939-2537/);
  assert.match(html, /LATEST WORK/);
  assert.doesNotMatch(html, /<img[^>]*alt=""/);
  assert.match(renderedText, /꼼꼼욕실 시공 사례/);
  assert.match(renderedText, new RegExp(`${stats.completedWorks}<small>건<\\/small>`));
  assert.match(renderedText, /꼼꼼욕실 시공 사례/);
  assert.match(renderedText, /필요한 곳만 정확하게 바꾼 실제 욕실 현장/);
  assert.match(renderedText, /최근에 마친 욕실 시공 사례를 소개합니다/);
  assert.doesNotMatch(renderedText, /자동으로 불러옵니다/);
  assert.doesNotMatch(renderedText, /블로그의 실제 상담|기록 기준|네이버 블로그 상담/);
  assert.match(renderedText, /시공 가능 여부와 예상 비용이 궁금하시면 전화로 편하게 상담해 주세요/);
  for (const path of ["about", "services", "works", "process", "faq"]) {
    assert.match(html, new RegExp(`href="/${path}"`));
    assert.ok(await readFile(new URL(`${path}.html`, outputRoot), "utf8"));
  }
  for (const path of ["toilet-replacement", "washbasin-replacement", "faucet-replacement", "bathroom-cabinet"]) {
    assert.ok(await readFile(new URL(`services/${path}.html`, outputRoot), "utf8"));
  }
  await assert.rejects(readFile(new URL("review.html", outputRoot), "utf8"));
  assert.doesNotMatch(html, /\/api\/blog/);
});

test("exports every substantial first-party construction page", async () => {
  const [posts, stats] = await Promise.all([
    readFile(blogPostsUrl, "utf8").then(JSON.parse),
    readFile(blogStatsUrl, "utf8").then(JSON.parse),
  ]);
  assert.equal(posts.length, stats.completedWorks);
  assert.ok(posts.length > 100);
  assert.equal(new Set(posts.map((post) => post.seoTitle)).size, posts.length);

  for (const post of posts) {
    assert.ok(post.content.length >= 20);
    assert.ok(post.images.length >= 3);
    assert.ok(post.displayTitle.length > 5);
    assert.ok(post.summary.includes("네이버 블로그 원문"));
    assert.ok(post.highlights.length >= 2 && post.highlights.length <= 3);
    assert.match(post.sourceHash, /^[a-f0-9]{64}$/);
    assert.equal(post.editorialMode, "source-derived");
    assert.equal(post.editorialVersion, "source-structure-v1");
    const html = await readFile(new URL(`works/${post.id}.html`, outputRoot), "utf8");
    assert.match(html, new RegExp(`<link rel="canonical" href="https://ggomggombath\\.com/works/${post.id}"`));
    assert.match(html, /BlogPosting/);
    assert.match(html, /BreadcrumbList/);
    assert.match(html, /isBasedOn/);
    assert.match(html, /citation/);
    assert.match(html, /사람이 작성한 원문 기준/);
    assert.match(html, /class="source-highlights"/);
    assert.match(html, new RegExp(`blog\\.naver\\.com/refresh-bath/${post.id}`));
    assert.doesNotMatch(html, /<img[^>]*alt=""/);
    assert.ok((html.match(/<p(?:\s|>)/g) ?? []).length < 30);
  }
});

test("stores a positive completed works count from the construction category", async () => {
  const stats = JSON.parse(await readFile(blogStatsUrl, "utf8"));

  assert.equal(stats.sourceCategory, "시공후기");
  assert.match(stats.sourceUrl, /categoryNo=9/);
  assert.ok(Number.isInteger(stats.completedWorks));
  assert.ok(stats.completedWorks > 0);
});

test("exports discovery, RSS and app metadata as static files", async () => {
  const [robots, sitemap, rss, indexNowKey, manifest, headers, postsSource] = await Promise.all([
    readFile(new URL("robots.txt", outputRoot), "utf8"),
    readFile(new URL("sitemap.xml", outputRoot), "utf8"),
    readFile(new URL("rss.xml", outputRoot), "utf8"),
    readFile(new URL("9a4f0c1b7d2e43f6a8c95b1e7042d639.txt", outputRoot), "utf8"),
    readFile(new URL("manifest.webmanifest", outputRoot), "utf8"),
    readFile(new URL("_headers", outputRoot), "utf8"),
    readFile(blogPostsUrl, "utf8"),
  ]);
  const posts = JSON.parse(postsSource);

  assert.match(robots, /Sitemap: https:\/\/ggomggombath\.com\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/ggomggombath\.com\/<\/loc>/);
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, posts.filter((post) => post.quality === "indexable").length + 10);
  assert.match(sitemap, /https:\/\/ggomggombath\.com\/services\/toilet-replacement/);
  assert.match(sitemap, /https:\/\/ggomggombath\.com\/works\/224346358464/);
  assert.match(rss, /<title>꼼꼼욕실 시공 사례<\/title>/);
  assert.equal(indexNowKey.trim(), "9a4f0c1b7d2e43f6a8c95b1e7042d639");
  assert.equal(JSON.parse(manifest).short_name, "꼼꼼욕실");
  assert.match(headers, /Strict-Transport-Security: max-age=31536000/);
});

test("paginates the complete work list ten items at a time", async () => {
  const [html, postsSource] = await Promise.all([
    readFile(new URL("works.html", outputRoot), "utf8"),
    readFile(blogPostsUrl, "utf8"),
  ]);
  const posts = JSON.parse(postsSource);
  const renderedText = html.replaceAll("<!-- -->", "");
  const totalPages = Math.ceil(posts.length / 10);

  assert.equal((html.match(/class="work-card"/g) ?? []).length, 10);
  assert.match(renderedText, new RegExp(`1–10 / ${posts.length}건`));
  assert.match(html, /aria-label="시공 사례 페이지"/);
  assert.match(html, /aria-label="이전 페이지"/);
  assert.match(html, /aria-label="다음 페이지"/);
  assert.match(renderedText, new RegExp(`총 ${totalPages}페이지 중 1페이지`));
});

test("runs the verification Worker only for the exact Naver ownership path", async () => {
  const config = JSON.parse(await readFile(assetsConfigUrl, "utf8"));

  assert.equal(config.name, "ggomggombath");
  assert.equal(config.main, "./worker/verification.ts");
  assert.equal(config.assets.directory, "./dist/client");
  assert.equal(config.assets.binding, "ASSETS");
  assert.deepEqual(config.assets.run_worker_first, [
    "/navera86801b065c0a29fe7b53f2f61c70f17.html",
    "/review",
    "/review/",
  ]);
});

test("gives core routes unique titles, canonicals and headings", async () => {
  const routes = ["about", "services", "works", "process", "faq"];
  const titles = new Set();
  const headings = new Set();
  for (const route of routes) {
    const html = await readFile(new URL(`${route}.html`, outputRoot), "utf8");
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    assert.match(html, new RegExp(`<link rel="canonical" href="https://ggomggombath\\.com/${route}"`));
    assert.ok(title);
    assert.ok(heading);
    titles.add(title);
    headings.add(heading);
  }
  assert.equal(titles.size, routes.length);
  assert.equal(headings.size, routes.length);
});

test("aligns the recent-work heading and completed-work metric", async () => {
  const styles = await readFile(globalStylesUrl, "utf8");

  assert.match(styles, /\.cases \.section-heading-row\s*{\s*align-items:\s*start;\s*}/);
  assert.match(styles, /\.cases \.section-heading-row > div\s*{\s*align-self:\s*start;\s*}/);
  assert.match(styles, /\.completed-work-count\s*{[^}]*align-items:\s*center;[^}]*padding:\s*18px 0 18px 18px;/);
});

test("keeps the header brand compact and close to the left edge", async () => {
  const styles = await readFile(globalStylesUrl, "utf8");

  assert.match(styles, /\.site-header\s*{[^}]*padding:\s*0 clamp\(20px, 3vw, 48px\);/);
  assert.match(styles, /\.brand-lockup\s*{[^}]*gap:\s*8px;/);
  assert.match(styles, /\.brand-lockup img\s*{[^}]*width:\s*52px;[^}]*height:\s*52px;/);
});

test("uses a clean hero image with diagonally balanced labels", async () => {
  const [html, styles] = await Promise.all([
    readFile(new URL("index.html", outputRoot), "utf8"),
    readFile(globalStylesUrl, "utf8"),
  ]);

  assert.doesNotMatch(html, /class="hero-seal"/);
  assert.doesNotMatch(styles, /\.hero-seal/);
  assert.match(styles, /\.hero-photo-frame\s*{[^}]*inset:\s*20px 4% 38px;/);
  assert.match(styles, /\.photo-label\s*{[^}]*left:\s*var\(--hero-label-edge\)/);
  assert.doesNotMatch(styles, /\.photo-label\s*{[^}]*right:/);
  assert.match(styles, /\.service-ticket\s*{[^}]*right:\s*var\(--hero-label-edge\)/);
});

test("exports responsive images without a runtime optimizer", async () => {
  const html = await readFile(new URL("index.html", outputRoot), "utf8");

  assert.match(html, /srcset="[^"]+type=s3[^"]+365w,[^"]+type=w2[^"]+743w/i);
  assert.match(html, /fetchpriority="high"/i);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /decoding="async"/);
  assert.doesNotMatch(html, /\/_vinext\/image/);
});

test("keeps the service and process sections concise and stationary", async () => {
  const [html, styles] = await Promise.all([
    readFile(new URL("index.html", outputRoot), "utf8"),
    readFile(globalStylesUrl, "utf8"),
  ]);

  assert.doesNotMatch(html, /class="service-note"/);
  assert.doesNotMatch(styles, /\.service-note/);
  assert.match(styles, /\.process-title-wrap\s*{\s*align-self:\s*start;\s*}/);
  assert.doesNotMatch(styles, /\.process-title-wrap\s*{[^}]*position:\s*sticky/);
});

test("keeps the favicon legible in dark browser themes", async () => {
  const [favicon, darkFavicon, logo] = await Promise.all([
    readFile(faviconUrl, "utf8"),
    readFile(darkFaviconUrl, "utf8"),
    readFile(logoUrl, "utf8"),
  ]);

  assert.match(favicon, /@media \(prefers-color-scheme:\s*dark\)/);
  assert.match(favicon, /\.frame\s*{\s*fill:\s*#093B5C;\s*stroke:\s*#F7F3ED;/);
  assert.match(favicon, /\.fixture\s*{\s*fill:\s*#093B5C;\s*stroke:\s*#F7F3ED;/);
  assert.match(favicon, /\.sparkle\s*{\s*fill:\s*#0B4F7B;/);
  assert.doesNotMatch(favicon, /#E76F43/);
  assert.doesNotMatch(logo, /#E76F43/);
  assert.match(darkFavicon, /fill="#093B5C" stroke="#F7F3ED"/);
  assert.doesNotMatch(darkFavicon, /#E76F43/);

  const html = await readFile(new URL("index.html", outputRoot), "utf8");
  assert.match(html, /favicon\.svg\?v=20260721-navy-v3/);
  assert.match(html, /favicon-dark\.svg\?v=20260721-navy-v3/);
  assert.match(html, /media="\(prefers-color-scheme: dark\)"/);
  assert.match(html, /logo\.svg\?v=20260721-navy-v3/);
});

test("offers a direct call action on mobile", async () => {
  const [html, styles] = await Promise.all([
    readFile(new URL("index.html", outputRoot), "utf8"),
    readFile(globalStylesUrl, "utf8"),
  ]);

  assert.match(html, /href="tel:\+821029392537"/);
  assert.doesNotMatch(html, /href="sms:/);
  assert.match(styles, /\.phone-mobile-actions\s*{\s*display:\s*none;/);
  assert.match(styles, /@media \(max-width:\s*980px\)[\s\S]*\.phone-contact \.phone-mobile-actions\s*{\s*display:\s*flex;/);
});
