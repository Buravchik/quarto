/* global process, console, document */
/**
 * Game-screen layout smoke (Playwright): no horizontal overflow on iPhone widths.
 * Regression for 021 PROBLEM 1 — waiting row (headline + ? + share + new match)
 * pushed the game grid past the right edge on 375–430px screens.
 *
 * Usage:
 *   npm run build
 *   npx playwright install chromium
 *   node scripts/smoke-layout.mjs
 */
import { createServer } from "node:http";
import { readFile, access } from "node:fs/promises";
import path from "node:path";

const BASE = "/quarto";
const WIDTHS = [320, 360, 375, 390, 393, 414, 430];
const SESSION_ID = "11111111-2222-4333-8444-555555555555";

const { chromium } = await import("playwright").catch(() => {
  console.error("Install Playwright: npx playwright install chromium");
  process.exit(1);
});

async function serveOut() {
  const root = path.resolve("out");
  await access(path.join(root, "index.html"));
  const server = createServer(async (req, res) => {
    try {
      let rel = decodeURIComponent((req.url ?? "/").split("?")[0]);
      if (rel === BASE || rel === `${BASE}/`) rel = "/index.html";
      else if (rel.startsWith(`${BASE}/`)) rel = rel.slice(BASE.length);
      if (rel.endsWith("/")) rel += "index.html";
      const file = path.resolve(root, rel.replace(/^\//, ""));
      const under = path.relative(root, file);
      if (under.startsWith("..") || path.isAbsolute(under)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const data = await readFile(file);
      const ext = path.extname(file);
      const type =
        ext === ".html" ? "text/html" : ext === ".js" ? "text/javascript" : ext === ".css" ? "text/css" : "application/octet-stream";
      res.writeHead(200, { "content-type": type });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { server, origin: `http://127.0.0.1:${server.address().port}${BASE}/` };
}

function snapshot(kind, lang) {
  const pool = ["p0","p1","p2","p3","p4","p5","p6","p7","p8","p9","pa","pb","pc","pd","pe","pf"];
  const base = {
    sessionId: SESSION_ID,
    cardId: "card",
    missMode: "persistent",
    pieRule: false,
    declareHints: false,
    difficulty: null,
    opponentKind: "human",
    settingsLocked: false,
    modules: ["classic4"],
    board: Array(16).fill(null),
    pool,
    pieceInHand: null,
    turnNotifiedAt: null,
    outcome: null,
    voidedSets: [],
    pendingVoidSets: [],
    lastPlacedCell: null,
    lastPlacerSeat: null,
    seatNames: ["Алексей Длинноимённый", null],
    chatTitle: lang === "ru" ? "Очень длинное название группового чата" : "A rather long group chat title",
  };
  if (kind === "waiting") {
    return { ...base, status: "waiting", phase: "waiting", turnSeat: null, seat0: { telegramUserId: "42" }, seat1: null };
  }
  if (kind === "invite") {
    return { ...base, status: "waiting", phase: "waiting", turnSeat: null, seat0: { telegramUserId: "7" }, seat1: null };
  }
  return {
    ...base,
    status: "active",
    phase: "place_received",
    turnSeat: 0,
    pieceInHand: "p0",
    pool: pool.slice(1),
    settingsLocked: true,
    seat0: { telegramUserId: "42" },
    seat1: { telegramUserId: "7" },
    seatNames: ["Алексей", "Sakvar"],
  };
}

const { server, origin } = await serveOut();
const browser = await chromium.launch();
const failures = [];

for (const lang of ["ru", "en"]) {
  for (const kind of ["waiting", "invite", "active"]) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 2 });
      await page.route("https://telegram.org/js/telegram-web-app.js", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/javascript",
          body: `window.Telegram = { WebApp: {
            initData: "user=%7B%22id%22%3A42%7D&auth_date=1700000000&hash=smoke",
            initDataUnsafe: { user: { id: 42, language_code: "${lang}" } },
            version: "8.0", platform: "ios", colorScheme: "dark", themeParams: {},
            ready() {}, expand() {}, onEvent() {}, offEvent() {}
          } };`,
        }),
      );
      await page.route("**/api/v1/sessions/**", (route) =>
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(snapshot(kind, lang)) }),
      );
      // One retry: a cold static server right after `next build` can be slow on CI.
      for (let attempt = 1; ; attempt++) {
        try {
          await page.goto(`${origin}?sessionId=${SESSION_ID}`, { waitUntil: "networkidle" });
          await page.waitForSelector(".ex-board", { timeout: 15000 });
          break;
        } catch (err) {
          if (attempt >= 2) throw err;
        }
      }
      const m = await page.evaluate(() => {
        const doc = document.documentElement;
        const main = document.querySelector("main.ex-app");
        let widest = 0;
        let widestSel = "";
        for (const el of document.querySelectorAll("main *")) {
          const r = el.getBoundingClientRect();
          if (r.right > widest) {
            widest = r.right;
            widestSel = `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}`;
          }
        }
        return {
          docScroll: doc.scrollWidth,
          client: doc.clientWidth,
          mainScroll: main ? main.scrollWidth : 0,
          mainClient: main ? main.clientWidth : 0,
          widest,
          widestSel,
        };
      });
      const over =
        m.docScroll > m.client + 1 || m.mainScroll > m.mainClient + 1 || m.widest > m.client + 1;
      const tag = `${lang}/${kind}/${width}px`;
      if (process.env.SMOKE_SHOTS && width === 390) {
        await page.screenshot({ path: path.join(process.env.SMOKE_SHOTS, `${lang}-${kind}-${width}.png`), fullPage: true });
      }
      if (over) failures.push(`${tag}: ${JSON.stringify(m)}`);
      else console.log(`ok   ${tag} (rightmost ${Math.round(m.widest)}/${m.client})`);
      await page.close();
    }
  }
}

await browser.close();
server.close();
if (failures.length) {
  console.error("FAIL horizontal overflow:\n" + failures.join("\n"));
  process.exit(1);
}
console.log("OK  game screen fits 320–430px without horizontal overflow");
