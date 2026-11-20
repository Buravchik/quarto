import { eq } from "drizzle-orm";
import { getDb } from "../../db/client";
import { cards, players } from "../../db/schema";
import { t } from "../i18n";
import { timeoutReady } from "../quarto/timeout";
import { cardView, formatCardMessage, preferredOpenSessionId } from "./cards";
import { COMPUTER_USER_ID } from "./computerSeat";
import { webAppOpenButton } from "./miniAppUrl";
import { getSession, type Seat } from "./sessions";

type ReplyMarkup = { reply_markup?: { inline_keyboard: Record<string, unknown>[][] } };

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
  sendMessage: (chatId: string, text: string, extra?: ReplyMarkup) => Promise<void>;
};

let transport: NotifyTransport | null = null;

export function setNotifyTransport(next: NotifyTransport | null) {
  transport = next;
}

async function langFor(userId: string | undefined): Promise<string> {
  if (!userId) return "en";
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(players)
      .where(eq(players.telegramUserId, userId))
      .limit(1);
    return rows[0]?.language || "en";
  } catch {
    return "en";
  }
}

function cardActionKeyboard(sessionId: string | undefined, lang?: string) {
  const copy = t(lang);
  const open = sessionId ? webAppOpenButton(copy.openMiniApp, sessionId) : null;
  const drop = { text: copy.dropInChat, switch_inline_query: "" };
  const rows: Record<string, unknown>[][] = [];
  if (open) rows.push([open]);
  rows.push([drop]);
  return { reply_markup: { inline_keyboard: rows } };
}

async function refreshCardMessage(cardId: string) {
  if (!transport) return;
  const db = getDb();
  const rows = await db.select().from(cards).where(eq(cards.cardId, cardId)).limit(1);
  const card = rows[0];
  if (!card) return;
  const view = await cardView(cardId);
  if (!view) return;
  const lang = await langFor(card.ownerTelegramUserId);
  const text = formatCardMessage(view, lang);
  const openSessionId = preferredOpenSessionId(view.slots);
  const extra = cardActionKeyboard(openSessionId, lang);
  try {
    if (card.inlineMessageId) {
      await transport.editInlineMessageText(card.inlineMessageId, text, extra);
    } else if (card.chatId && card.messageId != null) {
      await transport.editMessageText(card.chatId, card.messageId, text, extra);
    }
  } catch (err) {
    console.warn("card edit failed", err);
  }
}

async function dmWithOpen(userId: string | undefined, text: string, sessionId: string, lang?: string) {
  if (!transport || !userId || userId === COMPUTER_USER_ID) return;
  const copy = t(lang);
  const btn = webAppOpenButton(copy.openMiniApp, sessionId);
  const extra = btn
    ? { reply_markup: { inline_keyboard: [[btn]] } }
    : undefined;
  try {
    await transport.sendMessage(userId, text, extra);
  } catch (err) {
    console.warn("dm failed", err);
  }
}

/** After Mini App lobby creates a card: DM starter the challenge card + web_app open. */
export async function sendChallengeCardDm(opts: {
  telegramUserId: string;
  cardId: string;
  sessionId: string;
  lang?: string;
}) {
  if (!transport) return { ok: false as const, error: "no_transport" };
  const view = await cardView(opts.cardId);
  const text = view
    ? formatCardMessage(view, opts.lang)
    : t(opts.lang).cardTitle;
  const copy = t(opts.lang);
  const btn = webAppOpenButton(copy.openMiniApp, opts.sessionId);
  const drop = { text: copy.dropInChat, switch_inline_query: "" };
  const keyboard = btn ? [[btn], [drop]] : [[drop]];
  try {
    await transport.sendMessage(opts.telegramUserId, text, {
      reply_markup: { inline_keyboard: keyboard },
    });
    return { ok: true as const };
  } catch (err) {
    console.warn("sendChallengeCardDm failed", err);
    return { ok: false as const, error: "dm_failed" };
  }
}

export async function notifyOpponentJoined(sessionId: string) {
  const row = await getSession(sessionId);
  if (!row) return;
  const seat0 = row.seat0 as Seat;
  const lang = await langFor(seat0?.telegramUserId);
  const copy = t(lang);
  await dmWithOpen(
    seat0?.telegramUserId,
    `${copy.opponentJoined}. Session ${sessionId.slice(0, 8)}`,
    sessionId,
    lang,
  );
  await refreshCardMessage(row.cardId);
}

export async function notifyMatchEnded(sessionId: string) {
  const row = await getSession(sessionId);
  if (!row) return;
  const seat0 = row.seat0 as Seat;
  const seat1 = row.seat1 as Seat;
  const outcome = row.outcome as { type?: string; winnerSeat?: number } | null;
  for (const seat of [seat0, seat1]) {
    const lang = await langFor(seat?.telegramUserId);
    const copy = t(lang);
    const summary = outcome
      ? `${copy.matchEnded}: ${outcome.type}${outcome.winnerSeat != null ? ` (seat ${outcome.winnerSeat})` : ""}`
      : copy.matchEnded;
    await dmWithOpen(seat?.telegramUserId, summary, sessionId, lang);
  }
  await refreshCardMessage(row.cardId);
}

export async function notifyTurnChanged(sessionId: string) {
  const row = await getSession(sessionId);
  if (!row) return;
  const seat0 = row.seat0 as Seat;
  const seat1 = row.seat1 as Seat;
  const turn = row.turnSeat as 0 | 1 | null;
  const target = turn === 0 ? seat0 : turn === 1 ? seat1 : null;
  const waiting = turn === 0 ? seat1 : turn === 1 ? seat0 : null;
  const lang = await langFor(target?.telegramUserId);
  const copy = t(lang);
  await dmWithOpen(target?.telegramUserId, copy.yourTurn, sessionId, lang);
  if (timeoutReady(row.turnNotifiedAt ? row.turnNotifiedAt.toISOString() : null).ready) {
    const wLang = await langFor(waiting?.telegramUserId);
    await dmWithOpen(waiting?.telegramUserId, t(wLang).timeoutAvailable, sessionId, wLang);
  }
  await refreshCardMessage(row.cardId);
}

export async function notifyRematchOffered(sessionId: string) {
  const row = await getSession(sessionId);
  if (!row) return;
  const seat0 = row.seat0 as Seat;
  const seat1 = row.seat1 as Seat;
  const offer = row.rematchOffer as { offeredBy: string } | null;
  const other =
    offer?.offeredBy === seat0?.telegramUserId ? seat1?.telegramUserId : seat0?.telegramUserId;
  const lang = await langFor(other);
  await dmWithOpen(other, t(lang).rematchOffered, sessionId, lang);
  await refreshCardMessage(row.cardId);
}

export async function dispatchSessionEvents(sessionId: string, events: string[]) {
  for (const event of events) {
    if (event === "opponent_joined") await notifyOpponentJoined(sessionId);
    else if (event === "match_ended") await notifyMatchEnded(sessionId);
    else if (event === "turn_changed") await notifyTurnChanged(sessionId);
    else if (event === "rematch_offered") await notifyRematchOffered(sessionId);
  }
}
