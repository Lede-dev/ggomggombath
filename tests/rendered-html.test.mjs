import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../dist/client/", import.meta.url);
const assetsConfigUrl = new URL("../wrangler.assets.jsonc", import.meta.url);
const globalStylesUrl = new URL("../app/globals.css", import.meta.url);
const blogStatsUrl = new URL("../data/blog-stats.json", import.meta.url);
const sectionLinkUrl = new URL("../components/SectionLink.tsx", import.meta.url);

test("exports the homepage as a static asset", async () => {
  const [html, statsSource] = await Promise.all([
    readFile(new URL("index.html", outputRoot), "utf8"),
    readFile(blogStatsUrl, "utf8"),
  ]);
  const stats = JSON.parse(statsSource);
  const renderedText = html.replaceAll("<!-- -->", "");

  assert.match(html, /<title>꼼꼼욕실/);
  assert.match(html, /010-2939-2537/);
  assert.match(html, /LATEST WORK/);
  assert.match(renderedText, /COMPLETED WORKS/);
  assert.match(renderedText, new RegExp(`${stats.completedWorks}<small>건<\\/small>`));
  assert.match(renderedText, /네이버 블로그 ‘시공후기’ 기록 기준/);
  for (const targetId of ["services", "cases", "process", "faq"]) {
    assert.match(html, new RegExp(`href="#${targetId}"`));
  }
  assert.doesNotMatch(html, /\/api\/blog/);
});

test("stores a positive completed works count from the construction category", async () => {
  const stats = JSON.parse(await readFile(blogStatsUrl, "utf8"));

  assert.equal(stats.sourceCategory, "시공후기");
  assert.match(stats.sourceUrl, /categoryNo=9/);
  assert.ok(Number.isInteger(stats.completedWorks));
  assert.ok(stats.completedWorks > 0);
});

test("exports discovery and app metadata as static files", async () => {
  const [robots, sitemap, manifest, headers] = await Promise.all([
    readFile(new URL("robots.txt", outputRoot), "utf8"),
    readFile(new URL("sitemap.xml", outputRoot), "utf8"),
    readFile(new URL("manifest.webmanifest", outputRoot), "utf8"),
    readFile(new URL("_headers", outputRoot), "utf8"),
  ]);

  assert.match(robots, /Sitemap: https:\/\/ggomggombath\.com\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/ggomggombath\.com\/<\/loc>/);
  assert.equal(JSON.parse(manifest).short_name, "꼼꼼욕실");
  assert.match(headers, /Strict-Transport-Security: max-age=31536000/);
});

test("deploys only static assets without a Worker entry point", async () => {
  const config = JSON.parse(await readFile(assetsConfigUrl, "utf8"));

  assert.equal(config.name, "ggomggombath");
  assert.equal(config.assets.directory, "./dist/client");
  assert.equal("main" in config, false);
  assert.equal("binding" in config.assets, false);
});

test("anchor navigation does not hold mouse-wheel scrolling", async () => {
  const [styles, sectionLink] = await Promise.all([
    readFile(globalStylesUrl, "utf8"),
    readFile(sectionLinkUrl, "utf8"),
  ]);

  assert.doesNotMatch(styles, /scroll-behavior:\s*smooth/);
  assert.match(styles, /overflow-anchor:\s*none/);
  assert.match(styles, /html\s*{\s*scroll-padding-top:\s*84px;\s*}/);
  assert.match(styles, /@media \(max-width:\s*980px\)[\s\S]*html\s*{\s*scroll-padding-top:\s*76px;\s*}/);
  assert.match(sectionLink, /event\.preventDefault\(\)/);
  assert.match(sectionLink, /window\.scrollTo\(\{ top, behavior: "auto" \}\)/);
  assert.match(sectionLink, /window\.history\.replaceState/);
});

test("aligns the recent-work heading and completed-work metric", async () => {
  const styles = await readFile(globalStylesUrl, "utf8");

  assert.match(styles, /\.cases \.section-heading-row\s*{\s*align-items:\s*start;\s*}/);
  assert.match(styles, /\.cases \.section-heading-row > div\s*{\s*align-self:\s*start;\s*}/);
  assert.match(styles, /\.completed-work-count\s*{[^}]*align-items:\s*center;[^}]*padding:\s*18px 0 18px 18px;/);
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
