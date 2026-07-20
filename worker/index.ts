/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

const CANONICAL_HOST = "ggomggombath.com";
const HSTS_VALUE = "max-age=31536000";
const NAVER_VERIFICATION_PATH = "/navera86801b065c0a29fe7b53f2f61c70f17.html";
const NAVER_VERIFICATION_BODY = "naver-site-verification: navera86801b065c0a29fe7b53f2f61c70f17.html";

function permanentRedirect(url: URL) {
  return new Response(null, {
    status: 301,
    headers: {
      Location: url.toString(),
      "Strict-Transport-Security": HSTS_VALUE,
    },
  });
}

function withSecurityHeaders(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Strict-Transport-Security", HSTS_VALUE);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === NAVER_VERIFICATION_PATH) {
      return withSecurityHeaders(new Response(NAVER_VERIFICATION_BODY, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" },
      }));
    }

    if (url.pathname === "/review" || url.pathname === "/review/") {
      return permanentRedirect(new URL("https://ggomggombath.com/works"));
    }

    if (url.hostname === `www.${CANONICAL_HOST}`) {
      url.hostname = CANONICAL_HOST;
      url.protocol = "https:";
      return permanentRedirect(url);
    }

    if (url.hostname === CANONICAL_HOST && url.protocol !== "https:") {
      url.protocol = "https:";
      return permanentRedirect(url);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return withSecurityHeaders(await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths));
    }

    return withSecurityHeaders(await handler.fetch(request, env, ctx));
  },
};

export default worker;
