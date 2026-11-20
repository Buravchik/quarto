/**
 * Mini App shell smoke (Playwright).
 * Reproduces late Telegram initData and asserts lobby CTA appears.
 *
 * Usage:
 *   npm run build
 *   npx playwright install chromium
 *   node scripts/smoke-miniapp.mjs
 */
import { createServer } from "node:http";
import { readFile, access } from "node:fs/promises";
import path from "node:path";

const BASE = "/quarto";

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    console.error("Install Playwright: npm i -D playwright && npx playwright install chromium");
    process.exit(1);
  }
}

async function serveOut() {
  const root = path.resolve("out");
  await access(path.join(root, "index.html"));
  const server = createServer(async (req, res) => {
    try {
      let rel = decodeURIComponent((req.url ?? "/").split("?")[0]);
      // Map /quarto/... → out/...
      if (rel === BASE || rel === `${BASE}/`) rel = "/index.html";
      else if (rel.startsWith(`${BASE}/`)) rel = rel.slice(BASE.length);
      if (rel.endsWith("/")) rel += "index.html";
      if (rel === "/") rel = "/index.html";
      const file = path.join(root, rel.replace(/^\//, ""));
      const data = await readFile(file);
      const ext = path.extname(file);
      const type =
        ext === ".html"
          ? "text/html"
          : ext === ".js"
            ? "text/javascript"
            : ext === ".css"
              ? "text/css"
              : "application/octet-stream";
      res.writeHead(200, { "content-type": type });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  return { server, origin: `http://127.0.0.1:${port}${BASE}/` };
}

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();

await page.route("https://telegram.org/js/telegram-web-app.js", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: `
      window.Telegram = window.Telegram || {};
      window.Telegram.WebApp = window.Telegram.WebApp || {
        initData: "",
        initDataUnsafe: {},
        ready: function () {},
        expand: function () {}
      };
    `,
  });
});

const { server, origin: target } = await serveOut();
console.log("smoke-miniapp →", target);

await page.goto(target, { waitUntil: "networkidle" });
await page.waitForTimeout(150);
await page.evaluate(() => {
  window.Telegram = window.Telegram || {};
  window.Telegram.WebApp = {
    initData:
      "user=%7B%22id%22%3A42%2C%22language_code%22%3A%22en%22%7D&auth_date=1700000000&hash=smoke",
    initDataUnsafe: { user: { id: 42, language_code: "en" } },
    ready() {},
    expand() {},
  };
});

const cta = page.getByRole("button", { name: /Start a match|Начать партию/i });
let ok = false;
try {
  await cta.waitFor({ timeout: 8000 });
  ok = true;
} catch {
  ok = false;
}

const bodyText = await page.locator("main").innerText().catch(() => "");
const expressive = await page.locator("main[data-expressive='true']").count();
const hasThemeVar = await page.evaluate(() => {
  const main = document.querySelector("main.ex-app");
  if (!main) return false;
  return getComputedStyle(main).getPropertyValue("--ex-primary").trim().length > 0;
});
await browser.close();
server.close();

if (!ok) {
  console.error("FAIL: lobby CTA never appeared after late Telegram inject");
  console.error("main text:\n", bodyText.slice(0, 500));
  process.exit(1);
}

if (!expressive || !hasThemeVar) {
  console.error("FAIL: Expressive theme root missing (data-expressive / --ex-primary)");
  process.exit(1);
}

console.log("OK  Mini App lobby + Expressive theme after late initData");
process.exit(0);
