import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../../db/client";
import { cards } from "../../db/schema";
import type { CardSurface, MissMode } from "../quarto/types";
import { t } from "../i18n";
import { ensurePlayer, getAchievements, grantAchievements } from "./players";
import { createSession, listSessionsForCard, toSnapshot, type Seat } from "./sessions";

const SLOT_CAP = 8;

export async function createCard(opts: {
  ownerTelegramUserId: string;
  surface: CardSurface;
  chatId?: string;
  missMode?: MissMode;
  pieRule?: boolean;
  declareHints?: boolean;
  displayName?: string;
  language?: string;
}) {
  const db = getDb();
  const cardId = randomUUID();
  await ensurePlayer(opts.ownerTelegramUserId, opts.displayName ?? "", opts.language);
  await grantAchievements(opts.ownerTelegramUserId, ["host"]);
  await db.insert(cards).values({
    cardId,
    ownerTelegramUserId: opts.ownerTelegramUserId,
    surface: opts.surface,
    chatId: opts.chatId ?? null,
  });
  const sessionId = await createSession({
    cardId,
    seat0UserId: opts.ownerTelegramUserId,
    missMode: opts.missMode,
    pieRule: opts.pieRule,
    declareHints: opts.declareHints,
  });
  return { cardId, sessionId };
}

export async function setCardMessage(cardId: string, chatId: string, messageId: number) {
  const db = getDb();
  await db
    .update(cards)
    .set({ chatId, messageId })
    .where(eq(cards.cardId, cardId));
}

export async function setCardInlineMessage(cardId: string, inlineMessageId: string) {
  const db = getDb();
  await db
    .update(cards)
    .set({ inlineMessageId, surface: "inline" })
    .where(eq(cards.cardId, cardId));
}

export async function getCard(cardId: string) {
  const db = getDb();
  const rows = await db.select().from(cards).where(eq(cards.cardId, cardId)).limit(1);
  return rows[0] ?? null;
}

export async function addSlot(opts: {
  cardId: string;
  ownerTelegramUserId: string;
  missMode?: MissMode;
  pieRule?: boolean;
  declareHints?: boolean;
  displayName?: string;
}) {
  const existing = await listSessionsForCard(opts.cardId);
  if (existing.length >= SLOT_CAP) {
    return { error: "slot_cap" as const, max: SLOT_CAP };
  }
  await ensurePlayer(opts.ownerTelegramUserId, opts.displayName ?? "");
  const sessionId = await createSession({
    cardId: opts.cardId,
    seat0UserId: opts.ownerTelegramUserId,
    missMode: opts.missMode,
    pieRule: opts.pieRule,
    declareHints: opts.declareHints,
  });
  return { sessionId };
}

async function seatLabel(seat: Seat): Promise<string> {
  if (!seat?.telegramUserId) return "—";
  const row = await ensurePlayer(seat.telegramUserId);
  const name = row.displayName?.trim() || seat.telegramUserId;
  const ach = await getAchievements(seat.telegramUserId);
  const pins = (ach.pinned as string[]).slice(0, 2);
  const pinTxt = pins.length ? ` [${pins.join(",")}]` : "";
  return `${name}${pinTxt}`;
}

export async function cardView(cardId: string) {
  const card = await getCard(cardId);
  if (!card) return null;
  const slots = await listSessionsForCard(cardId);
  const mapped = [];
  for (const s of slots) {
    const snap = toSnapshot(s);
    const seat0 = s.seat0 as Seat;
    const seat1 = s.seat1 as Seat;
    mapped.push({
      sessionId: s.sessionId,
      status: s.status,
      missMode: s.missMode,
      pieRule: s.pieRule,
      declareHints: s.declareHints ?? false,
      modules: s.modules,
      seats: [seat0, seat1] as [Seat, Seat],
      seatLabels: [await seatLabel(seat0), await seatLabel(seat1)] as [string, string],
      turnSeat: snap.turnSeat,
      outcome: snap.outcome,
    });
  }
  return {
    cardId,
    surface: card.surface,
    chatId: card.chatId,
    messageId: card.messageId,
    slots: mapped,
  };
}

/** Open Mini App target: first waiting → first active|pie → first slot (014). */
export function preferredOpenSessionId(
  slots: { sessionId: string; status: string }[],
): string | undefined {
  if (!slots.length) return undefined;
  const waiting = slots.find((s) => s.status === "waiting");
  if (waiting) return waiting.sessionId;
  const live = slots.find((s) => s.status === "active" || s.status === "pie");
  if (live) return live.sessionId;
  return slots[0]?.sessionId;
}

export function formatCardMessage(
  view: NonNullable<Awaited<ReturnType<typeof cardView>>>,
  lang?: string,
): string {
  const copy = t(lang);
  const lines = [copy.cardTitle, ""];
  view.slots.forEach((slot, i) => {
    const a = slot.seatLabels?.[0] ?? "—";
    const b = slot.seatLabels?.[1] ?? "—";
    let status: string = copy.cardStatusActive;
    if (slot.status === "waiting") status = copy.cardStatusWaiting;
    else if (slot.status === "finished") status = copy.cardStatusFinished;
    else if (slot.status === "pie") status = copy.cardStatusActive;
    let turn = "";
    if (
      (slot.status === "active" || slot.status === "pie") &&
      slot.turnSeat != null
    ) {
      const turnName =
        slot.turnSeat === 0 ? a : slot.turnSeat === 1 ? b : "—";
      turn = ` · ${copy.cardTurnOf.replace("{name}", turnName)}`;
    }
    lines.push(`${i + 1}. ${status}${turn} · ${a} vs ${b}`);
  });
  if (view.slots.length === 0) lines.push("—");
  return lines.join("\n");
}

export { SLOT_CAP };
