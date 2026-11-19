import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../../db/client";
import { sessions } from "../../db/schema";
import {
  type EngineState,
  createInitialState,
  startMatch,
} from "../quarto/engine";
import type { MissMode } from "../quarto/types";

export type Seat = { telegramUserId: string; joinedAt: string } | null;

function engineFromRow(row: typeof sessions.$inferSelect): EngineState {
  const base = createInitialState({
    modules: (row.modules as string[]) ?? ["classic4"],
    missMode: (row.missMode as MissMode) ?? "persistent",
    pieRule: row.pieRule,
  });
  return {
    ...base,
    settingsLocked: row.settingsLocked,
    phase: row.phase as EngineState["phase"],
    board: row.board as (string | null)[],
    pool: row.pool as string[],
    pieceInHand: row.pieceInHand,
    turnSeat: row.turnSeat as 0 | 1 | null,
    openerSeat: row.openerSeat as 0 | 1 | null,
    voidedSets: (row.voidedSets as number[][]) ?? [],
    outcome: (row.outcome as EngineState["outcome"]) ?? null,
    turnNotifiedAt: row.turnNotifiedAt ? row.turnNotifiedAt.toISOString() : null,
    firstPlaceDone: row.firstPlaceDone ?? false,
    pieResolved: row.pieResolved ?? false,
    lastPlacerSeat: (row.lastPlacerSeat as 0 | 1 | null) ?? null,
    lastPlacedCell: row.lastPlacedCell ?? null,
    voidClaimOpen: row.voidClaimOpen ?? false,
    pendingVoidSets: (row.pendingVoidSets as number[][]) ?? [],
  };
}

export function toSnapshot(row: typeof sessions.$inferSelect) {
  const engine = engineFromRow(row);
  return {
    sessionId: row.sessionId,
    cardId: row.cardId,
    status: row.status,
    phase: engine.phase,
    missMode: row.missMode,
    pieRule: row.pieRule,
    settingsLocked: row.settingsLocked,
    modules: row.modules,
    seat0: row.seat0,
    seat1: row.seat1,
    openerSeat: engine.openerSeat,
    turnSeat: engine.turnSeat,
    board: engine.board,
    pool: engine.pool,
    pieceInHand: engine.pieceInHand,
    turnNotifiedAt: engine.turnNotifiedAt,
    outcome: engine.outcome,
    voidedSets: engine.voidedSets,
    traitCount: 4,
    cellCount: engine.board.length,
    boardLayoutId: "grid4x4",
  };
}

export async function createSession(opts: {
  cardId: string;
  seat0UserId: string;
  missMode?: MissMode;
  pieRule?: boolean;
}): Promise<string> {
  const db = getDb();
  const engine = createInitialState({
    missMode: opts.missMode,
    pieRule: opts.pieRule,
  });
  const sessionId = randomUUID();
  const now = new Date().toISOString();
  await db.insert(sessions).values({
    sessionId,
    cardId: opts.cardId,
    status: "waiting",
    missMode: engine.missMode,
    pieRule: engine.pieRule,
    modules: engine.modules,
    settingsLocked: false,
    seat0: { telegramUserId: opts.seat0UserId, joinedAt: now },
    seat1: null,
    phase: engine.phase,
    board: engine.board,
    pool: engine.pool,
    pieceInHand: null,
    voidedSets: [],
    pendingVoidSets: [],
    firstPlaceDone: false,
    pieResolved: false,
    voidClaimOpen: false,
  });
  return sessionId;
}

export async function getSession(sessionId: string) {
  const db = getDb();
  const rows = await db.select().from(sessions).where(eq(sessions.sessionId, sessionId)).limit(1);
  return rows[0] ?? null;
}

export async function listSessionsForCard(cardId: string) {
  const db = getDb();
  return db.select().from(sessions).where(eq(sessions.cardId, cardId));
}

export async function updateSessionSettings(
  sessionId: string,
  userId: string,
  patch: { missMode?: MissMode; pieRule?: boolean },
) {
  const row = await getSession(sessionId);
  if (!row) return { error: "not_found" as const };
  if (row.settingsLocked) return { error: "settings_locked" as const };
  const seat0 = row.seat0 as Seat;
  if (seat0?.telegramUserId !== userId) return { error: "forbidden" as const };
  if (row.status !== "waiting") return { error: "settings_locked" as const };

  const db = getDb();
  await db
    .update(sessions)
    .set({
      missMode: patch.missMode ?? row.missMode,
      pieRule: patch.pieRule ?? row.pieRule,
      updatedAt: new Date(),
    })
    .where(eq(sessions.sessionId, sessionId));
  return { ok: true as const };
}

export async function joinSession(sessionId: string, userId: string) {
  const row = await getSession(sessionId);
  if (!row) return { error: "not_found" as const };
  if (row.status !== "waiting") return { error: "conflict" as const };
  const seat0 = row.seat0 as Seat;
  const seat1 = row.seat1 as Seat;
  if (seat0?.telegramUserId === userId) return { error: "conflict" as const };
  if (seat1) return { error: "conflict" as const };

  let engine = engineFromRow(row);
  engine.settingsLocked = true;
  engine = startMatch(engine);

  const db = getDb();
  const now = new Date().toISOString();
  await db
    .update(sessions)
    .set({
      seat1: { telegramUserId: userId, joinedAt: now },
      settingsLocked: true,
      status: "active",
      phase: engine.phase,
      board: engine.board,
      pool: engine.pool,
      pieceInHand: engine.pieceInHand,
      openerSeat: engine.openerSeat,
      turnSeat: engine.turnSeat,
      pieResolved: engine.pieResolved,
      firstPlaceDone: engine.firstPlaceDone,
      turnNotifiedAt: engine.turnNotifiedAt ? new Date(engine.turnNotifiedAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(sessions.sessionId, sessionId));

  return { ok: true as const, sessionId };
}

export async function rematchAction(
  sessionId: string,
  userId: string,
  action: "offer" | "accept" | "decline",
) {
  const row = await getSession(sessionId);
  if (!row) return { error: "not_found" as const };
  if (row.status !== "finished") return { error: "forbidden" as const };
  const seat0 = row.seat0 as Seat;
  const seat1 = row.seat1 as Seat;
  const seated =
    seat0?.telegramUserId === userId || seat1?.telegramUserId === userId;
  if (!seated) return { error: "forbidden" as const };

  const db = getDb();
  const offer = row.rematchOffer as { offeredBy: string; state: "offered" | "declined" } | null;

  if (action === "offer") {
    await db
      .update(sessions)
      .set({
        rematchOffer: { offeredBy: userId, state: "offered" },
        updatedAt: new Date(),
      })
      .where(eq(sessions.sessionId, sessionId));
    return { offerState: "offered" as const };
  }

  if (action === "decline") {
    if (!offer || offer.state !== "offered") return { offerState: "none" as const };
    await db
      .update(sessions)
      .set({
        rematchOffer: { offeredBy: offer.offeredBy, state: "declined" },
        updatedAt: new Date(),
      })
      .where(eq(sessions.sessionId, sessionId));
    return { offerState: "declined" as const };
  }

  // accept
  if (!offer || offer.state !== "offered") return { error: "forbidden" as const };
  if (offer.offeredBy === userId) return { error: "forbidden" as const };
  if (!seat0?.telegramUserId || !seat1?.telegramUserId) {
    return { error: "forbidden" as const };
  }

  const newSessionId = await createSession({
    cardId: row.cardId,
    seat0UserId: seat0.telegramUserId,
    missMode: row.missMode as MissMode,
    pieRule: row.pieRule,
  });
  const joined = await joinSession(newSessionId, seat1.telegramUserId);
  if ("error" in joined) return { error: "forbidden" as const };

  await db
    .update(sessions)
    .set({
      rematchOfSessionId: sessionId,
      rematchOffer: null,
      updatedAt: new Date(),
    })
    .where(eq(sessions.sessionId, newSessionId));
  await db
    .update(sessions)
    .set({ rematchOffer: null, updatedAt: new Date() })
    .where(eq(sessions.sessionId, sessionId));

  return { newSessionId, offerState: "none" as const };
}

export async function saveEngine(sessionId: string, engine: EngineState, status?: string) {
  const db = getDb();
  const statusOut =
    status ??
    (engine.phase === "finished"
      ? "finished"
      : engine.phase === "pie_choice"
        ? "pie"
        : "active");
  await db
    .update(sessions)
    .set({
      phase: engine.phase,
      board: engine.board,
      pool: engine.pool,
      pieceInHand: engine.pieceInHand,
      turnSeat: engine.turnSeat,
      openerSeat: engine.openerSeat,
      lastPlacerSeat: engine.lastPlacerSeat,
      lastPlacedCell: engine.lastPlacedCell,
      firstPlaceDone: engine.firstPlaceDone,
      pieResolved: engine.pieResolved,
      voidClaimOpen: engine.voidClaimOpen,
      pendingVoidSets: engine.pendingVoidSets,
      voidedSets: engine.voidedSets,
      outcome: engine.outcome,
      settingsLocked: engine.settingsLocked,
      missMode: engine.missMode,
      pieRule: engine.pieRule,
      status: statusOut,
      turnNotifiedAt: engine.turnNotifiedAt ? new Date(engine.turnNotifiedAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(sessions.sessionId, sessionId));
}

export { engineFromRow };
