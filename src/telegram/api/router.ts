import type { IncomingMessage, ServerResponse } from "node:http";
import {
  getAchievementsHandler,
  getCardHandler,
  getSessionHandler,
  intentHandler,
  joinHandler,
  pinAchievementsHandler,
  postCardHandler,
  postSlotHandler,
  rematchHandler,
  settingsHandler,
} from "./handlers";
import { applyCors } from "../http";
import { rateLimit, rateLimitMutating } from "./rateLimit";

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
  add("POST", "/api/v1/sessions/:sessionId/rematch", rematchHandler);
  add("GET", "/api/v1/me/achievements", getAchievementsHandler);
  add("POST", "/api/v1/me/achievements/pin", pinAchievementsHandler);
}

export async function handleApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;
  if (!path.startsWith("/api/v1")) return false;

  applyCors(req, res);
  const method = (req.method ?? "GET").toUpperCase();
  if (method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }

  const ip = req.socket.remoteAddress ?? "unknown";
  const limited =
    method === "GET" || method === "HEAD" ? rateLimit(ip) : rateLimitMutating(ip);
  if (!limited) {
    res.statusCode = 429;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "rate_limited" }));
    return true;
  }

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
