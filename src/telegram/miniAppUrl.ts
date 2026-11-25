/**
 * Mini App URLs.
 * - `web_app` buttons: only work in private chats with the bot (Telegram API).
 * - Cross-chat / inline / groups: Main Mini App link `https://t.me/<bot>?startapp=<sessionId>`.
 */

let cachedBotUsername: string | undefined;

export function setBotUsername(username: string | undefined) {
  cachedBotUsername = username?.replace(/^@/, "") || undefined;
}

export function botUsername(): string | undefined {
  return (
    cachedBotUsername ||
    process.env.BOT_USERNAME?.replace(/^@/, "") ||
    undefined
  );
}

/** Mini App origin with trailing slash; query params after path (Pages / direct open). */
export function miniAppUrl(sessionId?: string): string | undefined {
  const webapp = process.env.TELEGRAM_WEBAPP_URL;
  if (!webapp) return undefined;
  const base = webapp.replace(/\/?$/, "/");
  if (!sessionId) return base;
  return `${base}?sessionId=${encodeURIComponent(sessionId)}`;
}

/**
 * Deep link that opens the bot's Main Mini App inside Telegram from any chat (inline/group):
 * `https://t.me/<bot>?startapp=<sessionId>` (Bot API 8.0 Main Mini App direct link).
 * Requires the Main Mini App to be enabled in @BotFather — no separate /newapp short name.
 */
export function miniAppTgLink(sessionId?: string): string | undefined {
  const user = botUsername();
  if (!user) return undefined;
  if (!sessionId) return `https://t.me/${user}?startapp`;
  return `https://t.me/${user}?startapp=${encodeURIComponent(sessionId)}`;
}

/** Private chat with bot → web_app. Elsewhere → t.me deep link url button. */
export function openMiniAppButton(
  text: string,
  sessionId: string | undefined,
  mode: "web_app" | "url" = "web_app",
): Record<string, unknown> | null {
  if (mode === "url") {
    const url = miniAppTgLink(sessionId) ?? miniAppUrl(sessionId);
    if (!url) return null;
    return { text, url };
  }
  const url = miniAppUrl(sessionId);
  if (!url) return null;
  return { text, web_app: { url } };
}

/** @deprecated Prefer openMiniAppButton — kept for callers expecting web_app only. */
export function webAppOpenButton(text: string, sessionId?: string) {
  return openMiniAppButton(text, sessionId, "web_app");
}
