import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../../db/client";
import { cards } from "../../db/schema";
import type { CardSurface, MissMode } from "../quarto/types";
import { ensurePlayer, getAchievements, grantAchievements } from "./players";
import { createSession, listSessionsForCard, toSnapshot, type Seat } from "./sessions";

const SLOT_CAP = 8;

export async function createCard(opts: {
  ownerTelegramUserId: string;
  surface: CardSurface;
  chatId?: string;
  missMode?: MissMode;
  pieRule?: boolean;
}) {
  const db = getDb();
  const cardId = randomUUID();
  await ensurePlayer(opts.ownerTelegramUserId);
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
}) {
  const existing = await listSessionsForCard(opts.cardId);
  if (existing.length >= SLOT_CAP) {
    return { error: "slot_cap" as const, max: SLOT_CAP };
  }
  const sessionId = await createSession({
    cardId: opts.cardId,
    seat0UserId: opts.ownerTelegramUserId,
    missMode: opts.missMode,
    pieRule: opts.pieRule,
  });
  return { sessionId };
}

async function seatLabel(seat: Seat): Promise<string> {
  if (!seat?.telegramUserId) return "—";
  const ach = await getAchievements(seat.telegramUserId);
  const pins = (ach.pinned as string[]).slice(0, 2);
  const pinTxt = pins.length ? ` [${pins.join(",")}]` : "";
  return `${seat.telegramUserId}${pinTxt}`;
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

export function formatCardMessage(view: NonNullable<Awaited<ReturnType<typeof cardView>>>): string {
  const webapp = process.env.TELEGRAM_WEBAPP_URL;
  const lines = [`Quarto · ${view.cardId.slice(0, 8)}`, `Surface: ${view.surface}`, ""];
  view.slots.forEach((slot, i) => {
    const a = slot.seatLabels?.[0] ?? slot.seats[0]?.telegramUserId ?? "—";
    const b = slot.seatLabels?.[1] ?? (slot.seats[1]?.telegramUserId ? slot.seats[1].telegramUserId : "waiting");
    const turn =
      slot.status === "active" && slot.turnSeat != null ? ` · turn seat ${slot.turnSeat}` : "";
    lines.push(`${i + 1}. ${slot.status}${turn} · ${a} vs ${b}`);
    if (webapp) {
      lines.push(`   play: ${webapp}?sessionId=${slot.sessionId}`);
    }
  });
  if (view.slots.length === 0) lines.push("(no slots)");
  return lines.join("\n");
}

export { SLOT_CAP };
