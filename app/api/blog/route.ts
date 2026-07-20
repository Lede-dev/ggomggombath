import { NextResponse } from "next/server";

const RSS_URL = "https://rss.blog.naver.com/refresh-bath.xml";

function readCdata(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function decodeEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function stripMarkup(value: string) {
  return decodeEntities(value.replace(/<img[\s\S]*$/i, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll(". ", ".")
    .replace(/\.$/, "");
}

export async function GET() {
  try {
    const response = await fetch(RSS_URL, {
      headers: { "User-Agent": "GGomGgomBathWebsite/1.0" },
      next: { revalidate: 900 },
    });

    if (!response.ok) throw new Error(`Naver RSS returned ${response.status}`);

    const xml = await response.text();
    const items = (xml.match(/<item>[\s\S]*?<\/item>/gi) ?? []).slice(0, 3).map((block) => {
      const description = readCdata(block, "description");
      const image = description.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? "";
      const excerpt = stripMarkup(description);

      return {
        title: decodeEntities(readCdata(block, "title")),
        link: readCdata(block, "link").replace(/\?.*$/, ""),
        date: formatDate(readCdata(block, "pubDate")),
        category: decodeEntities(readCdata(block, "category")) || "시공후기",
        image,
        excerpt: excerpt.length > 112 ? `${excerpt.slice(0, 112).trim()}…` : excerpt,
      };
    });

    return NextResponse.json(
      { items, source: RSS_URL, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400" } },
    );
  } catch {
    return NextResponse.json({ items: [] }, { status: 502 });
  }
}
