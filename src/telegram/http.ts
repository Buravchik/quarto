import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";

/** Allow Mini App origin(s); comma-separated TELEGRAM_WEBAPP_URL / CORS_ORIGINS. */
export function applyCors(req: IncomingMessage, res: ServerResponse) {
  const allowed = new Set<string>();
  for (const raw of [
    process.env.TELEGRAM_WEBAPP_URL,
    process.env.CORS_ORIGINS,
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ]) {
    if (!raw) continue;
    for (const part of raw.split(",")) {
      try {
        allowed.add(new URL(part.trim()).origin);
      } catch {
        /* skip */
      }
    }
  }
  const origin = req.headers.origin;
  if (origin && (allowed.has(origin) || allowed.has("*"))) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "origin");
  } else if (!origin) {
    // non-browser clients
  } else if (process.env.CORS_ORIGINS === "*") {
    res.setHeader("access-control-allow-origin", "*");
  }
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader(
    "access-control-allow-headers",
    "content-type, authorization",
  );
}

export function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

export async function readJson<T = unknown>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return {} as T;
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

export function loadEnvFile() {
  try {
    const raw = fs.readFileSync(path.resolve(".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i < 0) continue;
      const k = line.slice(0, i);
      const v = line.slice(i + 1);
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    // optional in tests
  }
}
