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

export type SessionRow = {
  sessionId: string;
  cardId: string;
  status: string;
  missMode: MissMode;
  pieRule: boolean;
  modules: string[];
  settingsLocked: boolean;
  seat0: Seat;
  seat1: Seat;
  engine: EngineState;
};

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
    firstPlaceDone: false,
    lastPlacerSeat: (row.lastPlacerSeat as 0 | 1 | null) ?? null,
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
      turnNotifiedAt: engine.turnNotifiedAt ? new Date(engine.turnNotifiedAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(sessions.sessionId, sessionId));

  return { ok: true as const, sessionId };
}

export async function saveEngine(sessionId: string, engine: EngineState, status?: string) {
  const db = getDb();
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
      voidedSets: engine.voidedSets,
      outcome: engine.outcome,
      settingsLocked: engine.settingsLocked,
      missMode: engine.missMode,
      pieRule: engine.pieRule,
      status: status ?? (engine.phase === "finished" ? "finished" : "active"),
      turnNotifiedAt: engine.turnNotifiedAt ? new Date(engine.turnNotifiedAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(sessions.sessionId, sessionId));
}

export { engineFromRow };
