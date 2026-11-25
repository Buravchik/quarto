/**
 * 021 invite + live card — pure helpers (no DB): keyboards, inline results,
 * callback/result id parsing, DM policy and DM text.
 */
import { t } from "../i18n";
import { COMPUTER_USER_ID } from "./computerSeat";
import { openMiniAppButton } from "./miniAppUrl";

export type Button = Record<string, unknown>;
export type InlineKeyboard = { inline_keyboard: Button[][] };

/** Inline result id for a prepared / inline invite: `s:<sessionId>` (≤ 64 bytes). */
export const RESULT_PREFIX = "s:";
/** Callback data on inline cards: `r:<sessionId>` → bind inline_message_id + refresh. */
export const REFRESH_PREFIX = "r:";

const SESSION_REF = /^[A-Za-z0-9_-]{8,64}$/;

export function isSessionRef(value: string | undefined | null): value is string {
  return !!value && SESSION_REF.test(value);
}

/** Parse `s:<id>` / `r:<id>`; null when the prefix or id shape does not match. */
export function parseSessionRef(prefix: string, data: string | undefined | null): string | null {
  if (!data || !data.startsWith(prefix)) return null;
  const id = data.slice(prefix.length);
  return isSessionRef(id) ? id : null;
}

/**
 * Card keyboard. Never emits a placeholder button: if no Mini App URL can be built
 * the open row is simply omitted.
 */
export function cardKeyboard(opts: {
  sessionId?: string;
  waiting: boolean;
  lang?: string;
  mode: "web_app" | "url";
  includeDrop?: boolean;
  refresh?: boolean;
}): InlineKeyboard {
  const copy = t(opts.lang);
  const rows: Button[][] = [];
  if (opts.sessionId) {
    const open = openMiniAppButton(
      opts.waiting ? copy.cardJoin : copy.cardOpen,
      opts.sessionId,
      opts.mode,
    );
    if (open) rows.push([open]);
    if (opts.refresh) {
      rows.push([{ text: copy.cardRefresh, callback_data: `${REFRESH_PREFIX}${opts.sessionId}` }]);
    }
  }
  if (opts.includeDrop) rows.push([{ text: copy.dropInChat, switch_inline_query: "" }]);
  return { inline_keyboard: rows };
}

/** InlineQueryResultArticle for one concrete session (inline mode + savePreparedInlineMessage). */
export function inviteArticle(opts: {
  sessionId: string;
  title: string;
  description: string;
  text: string;
  keyboard: InlineKeyboard;
}) {
  return {
    type: "article" as const,
    id: `${RESULT_PREFIX}${opts.sessionId}`,
    title: opts.title,
    description: opts.description,
    input_message_content: { message_text: opts.text },
    reply_markup: opts.keyboard,
  };
}

/** Seen in the Mini App (poll) within `windowMs` → present, no DM ping needed. */
export function isPresent(
  presence: Record<string, string> | null | undefined,
  userId: string,
  nowMs: number,
  windowMs = 25_000,
): boolean {
  const iso = presence?.[userId];
  if (!iso) return false;
  const at = Date.parse(iso);
  return Number.isFinite(at) && nowMs - at <= windowMs;
}

export type DmPlan = { userId: string; ping: boolean };

/**
 * DM policy (021):
 * - vs computer → no DMs at all;
 * - PvP → at most one status DM per seat per session; a *new* message (ping) only when
 *   something needs that player's attention and they are not in the Mini App right now;
 *   otherwise the existing DM (if any) is edited silently.
 */
export function planDms(input: {
  events: string[];
  seat0Id?: string | null;
  seat1Id?: string | null;
  turnSeat: 0 | 1 | null;
  status: string;
  vsComputer: boolean;
  rematchOfferedBy?: string | null;
  presence?: Record<string, string> | null;
  nowMs: number;
}): DmPlan[] {
  if (input.vsComputer) return [];
  const has = (e: string) => input.events.includes(e);
  const turnUser =
    input.turnSeat === 0 ? input.seat0Id : input.turnSeat === 1 ? input.seat1Id : null;
  const live = input.status === "active" || input.status === "pie";
  const out: DmPlan[] = [];
  for (const uid of [input.seat0Id, input.seat1Id]) {
    if (!uid || uid === COMPUTER_USER_ID) continue;
    const attention =
      ((has("turn_changed") || has("opponent_joined")) && live && turnUser === uid) ||
      has("match_ended") ||
      (has("rematch_offered") && !!input.rematchOfferedBy && uid !== input.rematchOfferedBy) ||
      (has("opponent_joined") && uid === input.seat0Id);
    out.push({
      userId: uid,
      ping: attention && !isPresent(input.presence, uid, input.nowMs),
    });
  }
  return out;
}

export function formatDmText(input: {
  lang?: string;
  opponentName: string;
  chatTitle?: string | null;
  status: string;
  mySeat: 0 | 1;
  turnSeat: 0 | 1 | null;
  outcome: { type?: string; winnerSeat?: number } | null;
  rematchOffered?: boolean;
  timeoutReady?: boolean;
}): string {
  const copy = t(input.lang);
  const lines = [copy.dmVs.replace("{name}", input.opponentName || "—")];
  if (input.chatTitle) lines.push(copy.dmFromChat.replace("{title}", `«${input.chatTitle}»`));
  lines.push("");
  if (input.status === "finished" || input.outcome) {
    const o = input.outcome;
    if (o?.type === "draw") lines.push(copy.dmDraw);
    else if (o?.winnerSeat != null) lines.push(o.winnerSeat === input.mySeat ? copy.youWon : copy.dmYouLost);
    else lines.push(copy.matchEnded);
    if (input.rematchOffered) lines.push(copy.rematchOffered);
  } else if (input.status === "waiting") {
    lines.push(copy.cardStatusWaiting);
  } else if (input.turnSeat === input.mySeat) {
    lines.push(copy.yourTurn);
  } else {
    lines.push(copy.dmTheirTurn);
    if (input.timeoutReady) lines.push(copy.timeoutAvailable);
  }
  return lines.join("\n");
}

/** Startup config check (logged as `[config]` warnings by the bot). */
export function miniAppConfigWarnings(env: Record<string, string | undefined>): string[] {
  const out: string[] = [];
  if (!env.TELEGRAM_WEBAPP_URL?.trim()) {
    out.push("TELEGRAM_WEBAPP_URL is not set — Mini App buttons are omitted from cards.");
  }
  return out;
}
