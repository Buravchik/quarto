import type { IncomingMessage, ServerResponse } from "node:http";
import {
  achievementsStub,
  getCardHandler,
  getSessionHandler,
  intentHandler,
  joinHandler,
  postCardHandler,
  postSlotHandler,
  rematchStub,
  settingsHandler,
} from "./handlers";
import { rateLimit } from "./rateLimit";

type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
) => Promise<void>;

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

/** Routes matching contracts/openapi.yaml */
export function registerOpenApiStubs() {
  add("GET", "/api/v1/cards/:cardId", getCardHandler);
  add("POST", "/api/v1/cards", postCardHandler);
  add("POST", "/api/v1/cards/:cardId/slots", postSlotHandler);
  add("GET", "/api/v1/sessions/:sessionId", getSessionHandler);
  add("POST", "/api/v1/sessions/:sessionId/join", joinHandler);
  add("POST", "/api/v1/sessions/:sessionId/settings", settingsHandler);
  add("POST", "/api/v1/sessions/:sessionId/intent", intentHandler);
  add("POST", "/api/v1/sessions/:sessionId/rematch", rematchStub);
  add("GET", "/api/v1/me/achievements", achievementsStub);
  add("POST", "/api/v1/me/achievements/pin", achievementsStub);
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
