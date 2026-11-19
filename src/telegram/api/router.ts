import type { IncomingMessage, ServerResponse } from "node:http";
import { rateLimit } from "./rateLimit";

type Handler = (req: IncomingMessage, res: ServerResponse, params: Record<string, string>) => Promise<void>;

const routes: { method: string; pattern: RegExp; keys: string[]; handler: Handler }[] = [];

function add(method: string, path: string, handler: Handler) {
  const keys: string[] = [];
  const pattern = new RegExp(
    "^" +
      path.replace(/\//g, "\\/").replace(/:([A-Za-z]+)/g, (_, k) => {
        keys.push(k);
        return "([^/]+)";
      }) +
      "$",
  );
  routes.push({ method, pattern, keys, handler });
}

async function notImplemented(_req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 501;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ error: "not_implemented" }));
}

/** Route stubs matching contracts/openapi.yaml — filled in US phases. */
export function registerOpenApiStubs() {
  add("GET", "/api/v1/cards/:cardId", notImplemented);
  add("POST", "/api/v1/cards", notImplemented);
  add("POST", "/api/v1/cards/:cardId/slots", notImplemented);
  add("POST", "/api/v1/sessions/:sessionId/join", notImplemented);
  add("POST", "/api/v1/sessions/:sessionId/settings", notImplemented);
  add("POST", "/api/v1/sessions/:sessionId/intent", notImplemented);
  add("POST", "/api/v1/sessions/:sessionId/rematch", notImplemented);
  add("GET", "/api/v1/me/achievements", notImplemented);
  add("POST", "/api/v1/me/achievements/pin", notImplemented);
}

export async function handleApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;
  if (!path.startsWith("/api/v1")) return false;

  const ip = req.socket.remoteAddress ?? "unknown";
  if (!rateLimit(ip)) {
    res.statusCode = 429;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "rate_limited" }));
    return true;
  }

  const method = (req.method ?? "GET").toUpperCase();
  for (const route of routes) {
    if (route.method !== method) continue;
    const match = path.match(route.pattern);
    if (!match) continue;
    const params: Record<string, string> = {};
    route.keys.forEach((k, i) => {
      params[k] = decodeURIComponent(match[i + 1] ?? "");
    });
    await route.handler(req, res, params);
    return true;
  }

  res.statusCode = 404;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ error: "not_found" }));
  return true;
}
