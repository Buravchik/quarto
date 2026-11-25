/**
 * 021: which session should the Mini App open on launch?
 *
 * Priority: a fresh Telegram `start_param` (invite link `startapp=<sessionId>`) beats a
 * stale `?sessionId=` left in the WebView URL — that stale query is what kept sending the
 * invitee back into his vs-computer game. A start_param is "consumed" once per launch so an
 * in-app navigation (rematch → `?sessionId=new`, «New match») is not overridden by it later.
 */
const SESSION_REF = /^[A-Za-z0-9_-]{8,64}$/;

export type LaunchInput = {
  startParam?: string | null;
  querySessionId?: string | null;
  consumedStartParam?: string | null;
};

export type LaunchDecision = {
  sessionId: string;
  source: "start_param" | "query" | "none";
  /** Persist as consumed (sessionStorage) when source === "start_param". */
  consume?: string;
};

export function normalizeStartParam(raw: string | null | undefined): string | null {
  const v = raw?.trim();
  if (!v) return null;
  // Accept `<uuid>` and `s_<uuid>` / `s-<uuid>` forms.
  const id = v.replace(/^s[_-]/, "");
  return SESSION_REF.test(id) ? id : null;
}

export function resolveLaunchSessionId(input: LaunchInput): LaunchDecision {
  const start = normalizeStartParam(input.startParam);
  if (start && start !== input.consumedStartParam) {
    return { sessionId: start, source: "start_param", consume: start };
  }
  const q = input.querySessionId?.trim();
  if (q && SESSION_REF.test(q)) return { sessionId: q, source: "query" };
  return { sessionId: "", source: "none" };
}

/** start_param from initDataUnsafe, else `tgWebAppStartParam` in the launch URL. */
export function readStartParam(win: Window | undefined = typeof window !== "undefined" ? window : undefined) {
  if (!win) return null;
  const fromTg = win.Telegram?.WebApp?.initDataUnsafe?.start_param;
  if (fromTg) return fromTg;
  try {
    const q = new URLSearchParams(win.location.search).get("tgWebAppStartParam");
    if (q) return q;
    const h = new URLSearchParams(win.location.hash.replace(/^#/, "")).get("tgWebAppStartParam");
    return h;
  } catch {
    return null;
  }
}
