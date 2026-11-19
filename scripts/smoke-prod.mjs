/**
 * Prod API smoke against Cloud Run using forged WebApp initData (HMAC).
 * Usage: BOT_TOKEN=... node scripts/smoke-prod.mjs
 * Optional: API_BASE=https://quarto-bot-….a.run.app
 */
import { createHmac } from "node:crypto";

const API =
  process.env.API_BASE ?? "https://quarto-bot-4lwkxnuf4q-ew.a.run.app";
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN required");
  process.exit(1);
}

function makeInitData(user) {
  const authDate = String(Math.floor(Date.now() / 1000));
  const fields = {
    auth_date: authDate,
    user: JSON.stringify(user),
  };
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const params = new URLSearchParams({ ...fields, hash });
  return params.toString();
}

async function req(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

const a = makeInitData({ id: 900001, first_name: "SmokeA", language_code: "en" });
const b = makeInitData({ id: 900002, first_name: "SmokeB", language_code: "en" });

const steps = [];
function ok(name, pass, detail) {
  steps.push({ name, pass, detail });
  console.log(`${pass ? "OK" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const health = await req("GET", "/health");
ok(
  "GET /health",
  health.status === 200 && (health.json?.raw === "ok" || health.json === "ok"),
  `status=${health.status} body=${JSON.stringify(health.json)}`,
);

const bad = await req("GET", "/api/v1/sessions/x?initData=bad");
ok("bad initData → 401", bad.status === 401, `status=${bad.status}`);

const created = await req("POST", "/api/v1/cards", {
  initData: a,
  surface: "dm",
  missMode: "persistent",
  pieRule: false,
});
ok("POST /cards", created.status === 201 && !!created.json.sessionId, JSON.stringify(created.json));
const sessionId = created.json.sessionId;

const joined = await req("POST", `/api/v1/sessions/${sessionId}/join`, { initData: b });
ok("POST join seat1", joined.status === 200, `status=${joined.status}`);

const snap = await req("GET", `/api/v1/sessions/${sessionId}?initData=${encodeURIComponent(a)}`);
ok("GET session", snap.status === 200 && snap.json.status === "active", `status=${snap.json.status}`);

const ach = await req("GET", `/api/v1/me/achievements?initData=${encodeURIComponent(a)}`);
ok("GET achievements", ach.status === 200 && Array.isArray(ach.json.unlocked), JSON.stringify(ach.json));

const pin = await req("POST", "/api/v1/me/achievements/pin", {
  initData: a,
  pinned: (ach.json.unlocked ?? []).slice(0, 2),
});
ok("POST pin", pin.status === 200 || pin.status === 400, `status=${pin.status} ${JSON.stringify(pin.json)}`);

const failed = steps.filter((s) => !s.pass);
console.log(`\n${steps.length - failed.length}/${steps.length} passed`);
process.exit(failed.length ? 1 : 0);
