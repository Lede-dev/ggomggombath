const NAVER_VERIFICATION_PATH = "/navera86801b065c0a29fe7b53f2f61c70f17.html";
const NAVER_VERIFICATION_BODY =
  "naver-site-verification: navera86801b065c0a29fe7b53f2f61c70f17.html";

interface Env {
  ASSETS: Fetcher;
}

const verificationWorker = {
  fetch(request: Request, env: Env) {
    if (new URL(request.url).pathname === NAVER_VERIFICATION_PATH) {
      return new Response(NAVER_VERIFICATION_BODY, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=300",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};

export default verificationWorker;
