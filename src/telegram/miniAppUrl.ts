/** Mini App origin with trailing slash; query params after /quarto/. */
export function miniAppUrl(sessionId?: string): string | undefined {
  const webapp = process.env.TELEGRAM_WEBAPP_URL;
  if (!webapp) return undefined;
  const base = webapp.replace(/\/?$/, "/");
  if (!sessionId) return base;
  return `${base}?sessionId=${encodeURIComponent(sessionId)}`;
}

export function webAppOpenButton(text: string, sessionId?: string) {
  const url = miniAppUrl(sessionId);
  if (!url) return null;
  return { text, web_app: { url } };
}
