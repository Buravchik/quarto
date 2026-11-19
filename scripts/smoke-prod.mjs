/**
 * Prod API smoke — quickstart A–G stand-ins against Cloud Run.
 * Usage: BOT_TOKEN=… node scripts/smoke-prod.mjs
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
  return new URLSearchParams({ ...fields, hash }).toString();
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

const steps = [];
function ok(name, pass, detail) {
  steps.push({ name, pass, detail });
  console.log(`${pass ? "OK" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const a = makeInitData({ id: 910001, first_name: "SmokeA", language_code: "en" });
const b = makeInitData({ id: 910002, first_name: "SmokeB", language_code: "en" });

{
  const health = await req("GET", "/health");
  ok("infra /health", health.status === 200 && health.json?.raw === "ok", String(health.status));
  const bad = await req("GET", "/api/v1/sessions/x?initData=bad");
  ok("infra bad initData 401", bad.status === 401, String(bad.status));
}

let sessionId;
{
  const created = await req("POST", "/api/v1/cards", {
    initData: a,
    surface: "dm",
    missMode: "persistent",
    pieRule: false,
  });
  ok("A create card", created.status === 201 && !!created.json.sessionId, JSON.stringify(created.json));
  sessionId = created.json.sessionId;

  const beforeJoin = await req("POST", `/api/v1/sessions/${sessionId}/settings`, {
    initData: a,
    missMode: "void",
    pieRule: true,
  });
  ok("US2 settings before join", beforeJoin.status === 200, String(beforeJoin.status));

  const joined = await req("POST", `/api/v1/sessions/${sessionId}/join`, { initData: b });
  ok("A join seat1", joined.status === 200, String(joined.status));

  const afterJoin = await req("POST", `/api/v1/sessions/${sessionId}/settings`, {
    initData: a,
    missMode: "persistent",
    pieRule: false,
  });
  ok("US2 settings locked after join", afterJoin.status === 403, `status=${afterJoin.status}`);

  const snap0 = await req(
    "GET",
    `/api/v1/sessions/${sessionId}?initData=${encodeURIComponent(a)}`,
  );
  const piece = snap0.json.pool?.[0];
  ok(
    "A session active + pool",
    snap0.status === 200 && snap0.json.status === "active" && piece,
    `phase=${snap0.json.phase} piece=${piece}`,
  );

  const give = await req("POST", `/api/v1/sessions/${sessionId}/intent`, {
    initData: a,
    type: "give",
    pieceId: piece,
  });
  ok(
    "A give",
    give.status === 200 && give.json.session?.pieceInHand === piece,
    `status=${give.status}`,
  );

  const place = await req("POST", `/api/v1/sessions/${sessionId}/intent`, {
    initData: b,
    type: "place",
    cellIndex: 0,
  });
  ok(
    "A place",
    place.status === 200 && place.json.session?.board?.[0] === piece,
    `status=${place.status}`,
  );

  const illegal = await req("POST", `/api/v1/sessions/${sessionId}/intent`, {
    initData: b,
    type: "declare",
    setCells: [0, 1, 2, 3],
  });
  ok(
    "B illegal declare",
    illegal.status === 400 && illegal.json.error === "illegal_declare",
    JSON.stringify(illegal.json),
  );

  const earlyTimeout = await req("POST", `/api/v1/sessions/${sessionId}/intent`, {
    initData: a,
    type: "claim_timeout",
  });
  ok(
    "E timeout too early",
    earlyTimeout.status === 409 && earlyTimeout.json.error === "timeout_too_early",
    JSON.stringify(earlyTimeout.json),
  );

  const resign = await req("POST", `/api/v1/sessions/${sessionId}/intent`, {
    initData: a,
    type: "resign",
  });
  ok(
    "A resign finish",
    resign.status === 200 && resign.json.session?.status === "finished",
    `status=${resign.json.session?.status}`,
  );
}

{
  const offer = await req("POST", `/api/v1/sessions/${sessionId}/rematch`, {
    initData: a,
    action: "offer",
  });
  ok("F rematch offer", offer.status === 200, JSON.stringify(offer.json));

  const accept = await req("POST", `/api/v1/sessions/${sessionId}/rematch`, {
    initData: b,
    action: "accept",
  });
  ok(
    "F rematch accept",
    accept.status === 200 && !!accept.json.newSessionId,
    JSON.stringify(accept.json),
  );
}

{
  const capCard = await req("POST", "/api/v1/cards", { initData: a, surface: "dm" });
  const cid = capCard.json.cardId;
  let last = { status: 0, json: {} };
  for (let i = 0; i < 7; i++) {
    last = await req("POST", `/api/v1/cards/${cid}/slots`, { initData: a });
  }
  ok("F fill to 8 slots", last.status === 201, `last=${last.status}`);
  const ninth = await req("POST", `/api/v1/cards/${cid}/slots`, { initData: a });
  ok(
    "F slot_cap on 9th",
    ninth.status === 409 && ninth.json.error === "slot_cap",
    JSON.stringify(ninth.json),
  );
}

{
  const ach = await req(
    "GET",
    `/api/v1/me/achievements?initData=${encodeURIComponent(a)}`,
  );
  ok(
    "G achievements",
    ach.status === 200 && (ach.json.unlocked?.length ?? 0) >= 1,
    JSON.stringify(ach.json),
  );
  const pinBad = await req("POST", "/api/v1/me/achievements/pin", {
    initData: a,
    pinned: ["first_match", "host", "rematch"],
  });
  ok(
    "G pin max 2",
    pinBad.status === 400 && pinBad.json.error === "pin_max",
    JSON.stringify(pinBad.json),
  );
  const unlocked = ach.json.unlocked ?? [];
  const pinOk = await req("POST", "/api/v1/me/achievements/pin", {
    initData: a,
    pinned: unlocked.slice(0, Math.min(2, unlocked.length)),
  });
  ok("G pin ok", pinOk.status === 200, JSON.stringify(pinOk.json));
}

const failed = steps.filter((s) => !s.pass);
console.log(`\n${steps.length - failed.length}/${steps.length} passed`);
if (failed.length) {
  console.log("Failed:", failed.map((f) => f.name).join(", "));
}
process.exit(failed.length ? 1 : 0);
