import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const host = "ggomggombath.com";
const key = "9a4f0c1b7d2e43f6a8c95b1e7042d639";
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sitemap = await readFile(resolve(rootDir, "public/sitemap.xml"), "utf8");
const urlList = [...sitemap.matchAll(/<loc>(https:\/\/ggomggombath\.com\/[^<]*)<\/loc>/g)].map((match) => match[1]);

if (urlList.length === 0) throw new Error("No canonical URLs found in sitemap.xml");

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList }),
});

if (!response.ok && response.status !== 202) {
  throw new Error(`IndexNow returned ${response.status}: ${await response.text()}`);
}

console.log(`IndexNow accepted ${urlList.length} URLs (${response.status}).`);
