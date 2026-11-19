import { eq } from "drizzle-orm";
import { getDb } from "../../db/client";
import { cards } from "../../db/schema";
import { t } from "../i18n";
import { cardView, formatCardMessage } from "./cards";
import { getSession, type Seat } from "./sessions";

export type NotifyTransport = {
  editMessageText: (chatId: string, messageId: number, text: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
};

let transport: NotifyTransport | null = null;

export function setNotifyTransport(next: NotifyTransport | null) {
  transport = next;
}

async function refreshCardMessage(cardId: string) {
  if (!transport) return;
  const db = getDb();
  const rows = await db.select().from(cards).where(eq(cards.cardId, cardId)).limit(1);
  const card = rows[0];
  if (!card?.chatId || card.messageId == null) return;
  const view = await cardView(cardId);
  if (!view) return;
  const text = formatCardMessage(view);
  try {
    await transport.editMessageText(card.chatId, card.messageId, text);
  } catch (err) {
    console.warn("card edit failed", err);
  }
}

async function dm(userId: string | undefined, text: string) {
  if (!transport || !userId) return;
  try {
    await transport.sendMessage(userId, text);
  } catch (err) {
    console.warn("dm failed", err);
  }
}

export async function notifyOpponentJoined(sessionId: string) {
  const row = await getSession(sessionId);
  if (!row) return;
  const seat0 = row.seat0 as Seat;
  const copy = t("en");
  await dm(seat0?.telegramUserId, `${copy.opponentJoined}. Session ${sessionId.slice(0, 8)}`);
  await refreshCardMessage(row.cardId);
}

export async function notifyMatchEnded(sessionId: string) {
  const row = await getSession(sessionId);
  if (!row) return;
  const seat0 = row.seat0 as Seat;
  const seat1 = row.seat1 as Seat;
  const copy = t("en");
  const outcome = row.outcome as { type?: string; winnerSeat?: number } | null;
  const summary = outcome
    ? `${copy.matchEnded}: ${outcome.type}${outcome.winnerSeat != null ? ` (seat ${outcome.winnerSeat})` : ""}`
    : copy.matchEnded;
  await dm(seat0?.telegramUserId, summary);
  await dm(seat1?.telegramUserId, summary);
  await refreshCardMessage(row.cardId);
}

export async function notifyTurnChanged(sessionId: string) {
  const row = await getSession(sessionId);
  if (!row) return;
  const seat0 = row.seat0 as Seat;
  const seat1 = row.seat1 as Seat;
  const turn = row.turnSeat as 0 | 1 | null;
  const target = turn === 0 ? seat0 : turn === 1 ? seat1 : null;
  const copy = t("en");
  await dm(target?.telegramUserId, copy.yourTurn);
  await refreshCardMessage(row.cardId);
}

export async function dispatchSessionEvents(sessionId: string, events: string[]) {
  for (const event of events) {
    if (event === "opponent_joined") await notifyOpponentJoined(sessionId);
    else if (event === "match_ended") await notifyMatchEnded(sessionId);
    else if (event === "turn_changed") await notifyTurnChanged(sessionId);
  }
}
