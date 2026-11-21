/**
 * Mini App URLs.
 * - `web_app` buttons: only work in private chats with the bot (Telegram API).
 * - Cross-chat / inline / groups: use `https://t.me/<bot>/<app>?startapp=` (Sudoku pattern).
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
 * Deep link that opens the Mini App inside Telegram from any chat (inline/group).
 * Prefers short-name app path when TELEGRAM_MINI_APP_SHORT_NAME is set.
 */
export function miniAppTgLink(sessionId?: string): string | undefined {
  const user = botUsername();
  if (!user) return undefined;
  const short = process.env.TELEGRAM_MINI_APP_SHORT_NAME?.trim();
  const base = short ? `https://t.me/${user}/${short}` : `https://t.me/${user}`;
  if (!sessionId) return short ? base : `https://t.me/${user}`;
  return `${base}?startapp=${encodeURIComponent(sessionId)}`;
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
