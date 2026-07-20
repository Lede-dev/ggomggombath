import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vinextCli = resolve(rootDir, "node_modules/vinext/dist/cli.js");
const startedAt = Date.now();

const child = spawn(process.execPath, [vinextCli, "build"], {
  cwd: rootDir,
  env: {
    ...process.env,
    WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH ?? ".wrangler/wrangler.log",
  },
  stdio: "inherit",
});

const exitCode = await new Promise((resolveExit) => {
  child.once("error", () => resolveExit(1));
  child.once("exit", (code) => resolveExit(code ?? 1));
});

if (exitCode === 0) process.exit(0);

const requiredOutputs = [
  resolve(rootDir, "dist/client/index.html"),
  resolve(rootDir, "dist/client/404.html"),
];
const outputsAreFresh = await Promise.all(
  requiredOutputs.map(async (path) => {
    try {
      return (await stat(path)).mtimeMs >= startedAt - 1_000;
    } catch {
      return false;
    }
  }),
).then((results) => results.every(Boolean));

if (process.platform === "win32" && outputsAreFresh) {
  console.warn("vinext exited during Windows prerender cleanup; fresh static output was verified.");
  process.exit(0);
}

process.exit(exitCode);
