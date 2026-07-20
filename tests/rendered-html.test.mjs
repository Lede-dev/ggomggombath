import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../dist/client/", import.meta.url);
const assetsConfigUrl = new URL("../wrangler.assets.jsonc", import.meta.url);

test("exports the homepage as a static asset", async () => {
  const html = await readFile(new URL("index.html", outputRoot), "utf8");

  assert.match(html, /<title>꼼꼼욕실/);
  assert.match(html, /010-2939-2537/);
  assert.match(html, /LATEST WORK/);
  assert.doesNotMatch(html, /\/api\/blog/);
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
