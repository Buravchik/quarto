import { eq } from "drizzle-orm";
import { getDb } from "../../db/client";
import { cards } from "../../db/schema";
import { t } from "../i18n";
import { timeoutReady } from "../quarto/timeout";
import { cardView, formatCardMessage, preferredOpenSessionId, setCardMessage } from "./cards";
import { COMPUTER_USER_ID } from "./computerSeat";
import {
  cardKeyboard,
  formatDmText,
  inviteArticle,
  planDms,
  type InlineKeyboard,
} from "./liveCard";
import { isMessageGone, isNotModified, liveEdits, retryAfterSeconds } from "./liveEdit";
import { miniAppTgLink } from "./miniAppUrl";
import { getPlayerLanguage, getPlayerName } from "./players";
import { computerSeatIndex, getSession, setDmMessage, type Seat } from "./sessions";

type ReplyMarkup = { reply_markup?: InlineKeyboard };

export type NotifyTransport = {
  editMessageText: (
    chatId: string,
    messageId: number,
    text: string,
    extra?: ReplyMarkup,
  ) => Promise<void>;
  editInlineMessageText: (
    inlineMessageId: string,
    text: string,
    extra?: ReplyMarkup,
  ) => Promise<void>;
  sendMessage: (
    chatId: string,
    text: string,
    extra?: ReplyMarkup,
  ) => Promise<{ message_id: number } | void>;
  deleteMessage?: (chatId: string, messageId: number) => Promise<void>;
  /** Bot API 8.0 savePreparedInlineMessage → id for WebApp.shareMessage. */
  savePreparedInlineMessage?: (
    userId: string,
    result: ReturnType<typeof inviteArticle>,
  ) => Promise<{ id: string; expiration_date?: number }>;
};

let transport: NotifyTransport | null = null;

export function setNotifyTransport(next: NotifyTransport | null) {
  transport = next;
}

export function getNotifyTransport(): NotifyTransport | null {
  return transport;
}

/** Run one Telegram edit; swallow «not modified», rethrow 429 for the coalescer. */
async function safeEdit(label: string, fn: () => Promise<void>): Promise<"ok" | "gone"> {
  try {
    await fn();
    return "ok";
  } catch (err) {
    if (isNotModified(err)) return "ok";
    if (retryAfterSeconds(err) != null) throw err;
    if (isMessageGone(err)) return "gone";
    console.warn(`${label} failed`, String((err as Error)?.message ?? err));
    return "ok";
  }
}

/** Build card text + keyboard for one target surface. */
async function loadCardRow(cardId: string) {
  const db = getDb();
  const rows = await db.select().from(cards).where(eq(cards.cardId, cardId)).limit(1);
  return rows[0] ?? null;
}

async function renderCard(cardId: string) {
  const card = await loadCardRow(cardId);
  if (!card) return null;
  const view = await cardView(cardId);
  if (!view) return null;
  const lang = await getPlayerLanguage(card.ownerTelegramUserId);
  const text = formatCardMessage(view, lang);
  const openSessionId = preferredOpenSessionId(view.slots);
  const waiting = view.slots.find((s) => s.sessionId === openSessionId)?.status === "waiting";
  return { view, card, lang, text, openSessionId, waiting };
}

/**
 * 021: one live card per game. Edits the inline copy (shared via shareMessage / inline
 * mode) and the chat copy (/new or the bot DM card). Coalesced per card; 429-aware.
 */
export async function refreshCardMessage(cardId: string) {
  if (!transport) return;
  const tr = transport;
  // Vs-computer / never-posted cards have nothing to edit — skip the render work.
  const head = await loadCardRow(cardId);
  if (!head || (!head.inlineMessageId && (head.chatId == null || head.messageId == null))) return;
  await liveEdits.run(`card:${cardId}`, async () => {
    const r = await renderCard(cardId);
    if (!r) return;
    const { card, lang, text, openSessionId, waiting } = r;
    if (card.inlineMessageId) {
      const kb = cardKeyboard({ sessionId: openSessionId, waiting, lang, mode: "url", refresh: true });
      await safeEdit("inline card edit", () =>
        tr.editInlineMessageText(card.inlineMessageId!, text, { reply_markup: kb }),
      );
    }
    if (card.chatId && card.messageId != null) {
      // web_app buttons only work in the private chat with the bot.
      const isBotDm = card.chatId === card.ownerTelegramUserId;
      const kb = cardKeyboard({
        sessionId: openSessionId,
        waiting,
        lang,
        mode: isBotDm ? "web_app" : "url",
        includeDrop: isBotDm,
      });
      await safeEdit("chat card edit", () =>
        tr.editMessageText(card.chatId!, card.messageId!, text, { reply_markup: kb }),
      );
    }
  });
}

/** Inline result for this exact session — no placeholders, the link carries startapp=<sessionId>. */
export async function buildInviteResult(sessionId: string) {
  const row = await getSession(sessionId);
  if (!row) return null;
  const r = await renderCard(row.cardId);
  if (!r) return null;
  const copy = t(r.lang);
  const waiting = row.status === "waiting";
  const keyboard = cardKeyboard({ sessionId, waiting, lang: r.lang, mode: "url", refresh: true });
  return {
    row,
    lang: r.lang,
    link: miniAppTgLink(sessionId) ?? null,
    article: inviteArticle({
      sessionId,
      title: copy.shareInviteTitle,
      description: r.view.ownerName
        ? `${copy.cardInviteFrom.replace("{name}", r.view.ownerName)} · ${copy.shareInviteDescription}`
        : copy.shareInviteDescription,
      text: r.text,
      keyboard,
    }),
  };
}

/** After Mini App lobby creates a PvP card: DM the starter the live card (stored for edits). */
export async function sendChallengeCardDm(opts: {
  telegramUserId: string;
  cardId: string;
  sessionId: string;
  lang?: string;
}) {
  if (!transport) return { ok: false as const, error: "no_transport" };
  const view = await cardView(opts.cardId);
  const text = view ? formatCardMessage(view, opts.lang) : t(opts.lang).cardTitle;
  const kb = cardKeyboard({
    sessionId: opts.sessionId,
    waiting: true,
    lang: opts.lang,
    mode: "web_app",
    includeDrop: true,
  });
  try {
    const sent = await transport.sendMessage(opts.telegramUserId, text, { reply_markup: kb });
    if (sent && typeof sent.message_id === "number") {
      await setCardMessage(opts.cardId, opts.telegramUserId, sent.message_id);
    }
    return { ok: true as const };
  } catch (err) {
    console.warn("sendChallengeCardDm failed", String(err));
    return { ok: false as const, error: "dm_failed" };
  }
}

type Row = NonNullable<Awaited<ReturnType<typeof getSession>>>;

async function renderDm(row: Row, userId: string) {
  const seat0 = row.seat0 as Seat;
  const seat1 = row.seat1 as Seat;
  const mySeat: 0 | 1 = seat0?.telegramUserId === userId ? 0 : 1;
  const opponent = mySeat === 0 ? seat1 : seat0;
  const lang = await getPlayerLanguage(userId);
  const opponentName = (await getPlayerName(opponent?.telegramUserId)) ?? "—";
  const cardRow = await loadCardRow(row.cardId);
  const offer = row.rematchOffer as { offeredBy: string; state: string } | null;
  const text = formatDmText({
    lang,
    opponentName,
    chatTitle: cardRow?.chatTitle ?? null,
    status: row.status,
    mySeat,
    turnSeat: row.turnSeat as 0 | 1 | null,
    outcome: row.outcome as { type?: string; winnerSeat?: number } | null,
    rematchOffered: offer?.state === "offered" && offer.offeredBy !== userId,
    timeoutReady:
      row.turnSeat !== mySeat &&
      timeoutReady(row.turnNotifiedAt ? row.turnNotifiedAt.toISOString() : null).ready,
  });
  const kb = cardKeyboard({
    sessionId: row.sessionId,
    waiting: false,
    lang,
    mode: "web_app",
  });
  return { text, extra: { reply_markup: kb } };
}

/** Ping: replace the previous status DM with a fresh one (so it notifies), keep only one. */
async function pingDm(row: Row, userId: string) {
  if (!transport) return;
  const { text, extra } = await renderDm(row, userId);
  const prev = (row.dmMessages ?? {})[userId];
  if (prev != null && transport.deleteMessage) {
    await transport.deleteMessage(userId, prev).catch(() => undefined);
  }
  try {
    const sent = await transport.sendMessage(userId, text, extra);
    if (sent && typeof sent.message_id === "number") {
      await setDmMessage(row.sessionId, userId, sent.message_id);
    }
  } catch (err) {
    console.warn("dm ping failed", String(err));
  }
}

/** Silent: edit the existing status DM if there is one; never send a new message. */
async function editDm(sessionId: string, userId: string) {
  if (!transport) return;
  const tr = transport;
  await liveEdits.run(`dm:${sessionId}:${userId}`, async () => {
    const row = await getSession(sessionId);
    const messageId = row ? (row.dmMessages ?? {})[userId] : undefined;
    if (!row || messageId == null) return;
    const { text, extra } = await renderDm(row, userId);
    const res = await safeEdit("dm edit", () => tr.editMessageText(userId, messageId, text, extra));
    if (res === "gone") await setDmMessage(sessionId, userId, null);
  });
}

async function syncDms(row: Row, events: string[]) {
  const offer = row.rematchOffer as { offeredBy: string } | null;
  const plans = planDms({
    events,
    seat0Id: (row.seat0 as Seat)?.telegramUserId,
    seat1Id: (row.seat1 as Seat)?.telegramUserId,
    turnSeat: row.turnSeat as 0 | 1 | null,
    status: row.status,
    vsComputer: computerSeatIndex(row) != null || !!row.difficulty,
    rematchOfferedBy: offer?.offeredBy ?? null,
    presence: row.presence,
    nowMs: Date.now(),
  });
  for (const p of plans) {
    if (p.userId === COMPUTER_USER_ID) continue;
    if (p.ping) await pingDm(row, p.userId);
    else await editDm(row.sessionId, p.userId);
  }
}

/**
 * One pass per request: refresh the card once and sync DMs once, however many
 * engine events (computer turns, join + turn) the request produced.
 */
export async function dispatchSessionEvents(sessionId: string, events: string[]) {
  if (!transport || events.length === 0) return;
  const row = await getSession(sessionId);
  if (!row) return;
  try {
    await syncDms(row, events);
  } catch (err) {
    console.warn("syncDms failed", String(err));
  }
  try {
    await refreshCardMessage(row.cardId);
  } catch (err) {
    console.warn("refreshCardMessage failed", String(err));
  }
}

/** Back-compat wrappers (older call sites / docs). */
export const notifyOpponentJoined = (id: string) => dispatchSessionEvents(id, ["opponent_joined"]);
export const notifyMatchEnded = (id: string) => dispatchSessionEvents(id, ["match_ended"]);
export const notifyTurnChanged = (id: string) => dispatchSessionEvents(id, ["turn_changed"]);
export const notifyRematchOffered = (id: string) => dispatchSessionEvents(id, ["rematch_offered"]);
