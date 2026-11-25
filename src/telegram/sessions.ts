import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../../db/client";
import { sessions } from "../../db/schema";
import { chooseIntent } from "../quarto/computer/policy";
import {
  type EngineState,
  applyIntent,
  createInitialState,
  startMatch,
} from "../quarto/engine";
import type { MissMode } from "../quarto/types";
import {
  COMPUTER_USER_ID,
  type Difficulty,
  isComputerSeat,
  isDifficulty,
} from "./computerSeat";

export type Seat = { telegramUserId: string; joinedAt: string } | null;

const COMPUTER_TURN_CAP = 8;

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

export function computerSeatIndex(row: {
  seat0: unknown;
  seat1: unknown;
}): 0 | 1 | null {
  if (isComputerSeat(row.seat0 as Seat)) return 0;
  if (isComputerSeat(row.seat1 as Seat)) return 1;
  return null;
}

export function toSnapshot(row: typeof sessions.$inferSelect) {
  const engine = engineFromRow(row);
  const difficulty = (row.difficulty as Difficulty | null) ?? null;
  const opponentKind =
    computerSeatIndex(row) != null ? ("computer" as const) : ("human" as const);
  return {
    sessionId: row.sessionId,
    cardId: row.cardId,
    status: row.status,
    phase: engine.phase,
    missMode: row.missMode,
    pieRule: row.pieRule,
    declareHints: row.declareHints ?? false,
    difficulty,
    opponentKind,
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
    pendingVoidSets: engine.pendingVoidSets,
    lastPlacedCell: engine.lastPlacedCell,
    lastPlacerSeat: engine.lastPlacerSeat,
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
  declareHints?: boolean;
  difficulty?: Difficulty | null;
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
    declareHints: opts.declareHints ?? false,
    difficulty: opts.difficulty ?? null,
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

/** Create waiting session, seat computer as seat1, start match, run opening computer turns. */
export async function createVsComputerSession(opts: {
  cardId: string;
  seat0UserId: string;
  difficulty: Difficulty;
  missMode?: MissMode;
  pieRule?: boolean;
  declareHints?: boolean;
}): Promise<string> {
  const sessionId = await createSession({
    cardId: opts.cardId,
    seat0UserId: opts.seat0UserId,
    missMode: opts.missMode,
    pieRule: opts.pieRule,
    declareHints: opts.declareHints,
    difficulty: opts.difficulty,
  });

  let engine = engineFromRow((await getSession(sessionId))!);
  engine.settingsLocked = true;
  // Human is seat0; random opener still OK
  engine = startMatch(engine);

  const now = new Date().toISOString();
  const db = getDb();
  await db
    .update(sessions)
    .set({
      seat1: { telegramUserId: COMPUTER_USER_ID, joinedAt: now },
      settingsLocked: true,
      status: "active",
      difficulty: opts.difficulty,
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

  await runComputerTurns(sessionId);
  return sessionId;
}

export async function getSession(sessionId: string) {
  const db = getDb();
  const rows = await db.select().from(sessions).where(eq(sessions.sessionId, sessionId)).limit(1);
  return rows[0] ?? null;
}

/** 021: open PvP invites owned by this user (inline mode with empty query). */
export async function listWaitingSessionsForOwner(userId: string, limit = 5) {
  const db = getDb();
  return db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.status, "waiting"),
        isNull(sessions.difficulty),
        sql`${sessions.seat0}->>'telegramUserId' = ${userId}`,
      ),
    )
    .orderBy(desc(sessions.createdAt))
    .limit(limit);
}

const presenceWrites = new Map<string, number>();
const PRESENCE_WRITE_EVERY_MS = 10_000;

/**
 * 021: remember that a seated player has the Mini App open (GET poll). Throttled per
 * session+user so the 2.5 s poll does not turn into a DB write each time. Never throws.
 */
export async function markPresent(sessionId: string, userId: string, nowMs = Date.now()) {
  const key = `${sessionId}:${userId}`;
  const last = presenceWrites.get(key) ?? 0;
  if (nowMs - last < PRESENCE_WRITE_EVERY_MS) return;
  presenceWrites.set(key, nowMs);
  try {
    const db = getDb();
    const iso = new Date(nowMs).toISOString();
    await db
      .update(sessions)
      .set({
        presence: sql`coalesce(${sessions.presence}, '{}'::jsonb) || jsonb_build_object(${userId}::text, ${iso}::text)`,
      })
      .where(eq(sessions.sessionId, sessionId));
  } catch (err) {
    console.warn("markPresent failed", String(err));
  }
}

/** 021: store (or forget with null) the single status DM message id for a seat. */
export async function setDmMessage(sessionId: string, userId: string, messageId: number | null) {
  const db = getDb();
  const patch =
    messageId == null
      ? sql`coalesce(${sessions.dmMessages}, '{}'::jsonb) - ${userId}::text`
      : sql`coalesce(${sessions.dmMessages}, '{}'::jsonb) || jsonb_build_object(${userId}::text, ${messageId}::int)`;
  await db.update(sessions).set({ dmMessages: patch }).where(eq(sessions.sessionId, sessionId));
}

export async function listSessionsForCard(cardId: string) {
  const db = getDb();
  return db.select().from(sessions).where(eq(sessions.cardId, cardId));
}

export async function updateSessionSettings(
  sessionId: string,
  userId: string,
  patch: { missMode?: MissMode; pieRule?: boolean; declareHints?: boolean },
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
      declareHints: patch.declareHints ?? row.declareHints,
      updatedAt: new Date(),
    })
    .where(eq(sessions.sessionId, sessionId));
  return { ok: true as const };
}

export async function joinSession(sessionId: string, userId: string) {
  const row = await getSession(sessionId);
  if (!row) return { error: "not_found" as const };
  if (row.status !== "waiting") return { error: "conflict" as const };
  if (row.difficulty) return { error: "conflict" as const };
  const seat0 = row.seat0 as Seat;
  const seat1 = row.seat1 as Seat;
  if (seat0?.telegramUserId === userId) return { error: "conflict" as const };
  if (seat1) return { error: "conflict" as const };
  if (userId === COMPUTER_USER_ID) return { error: "conflict" as const };

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
  const vsComputer = computerSeatIndex(row) != null;
  const difficulty =
    (isDifficulty(row.difficulty) ? row.difficulty : null) ??
    ("normal" as Difficulty);

  // Vs computer: offer immediately starts a new computer match for the human (seat0).
  if (action === "offer" && vsComputer) {
    const humanId = seat0?.telegramUserId;
    if (!humanId || humanId === COMPUTER_USER_ID || humanId !== userId) {
      return { error: "forbidden" as const };
    }
    const newSessionId = await createVsComputerSession({
      cardId: row.cardId,
      seat0UserId: humanId,
      difficulty,
      missMode: row.missMode as MissMode,
      pieRule: row.pieRule,
      declareHints: row.declareHints ?? false,
    });
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
    declareHints: row.declareHints ?? false,
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

/** Apply computer policy while it is the computer's turn. */
export async function runComputerTurns(sessionId: string): Promise<{ events: string[] }> {
  const events: string[] = [];
  for (let i = 0; i < COMPUTER_TURN_CAP; i++) {
    const row = await getSession(sessionId);
    if (!row) break;
    const seat = computerSeatIndex(row);
    if (seat == null) break;
    if (!isDifficulty(row.difficulty)) break;

    let engine = engineFromRow(row);
    if (engine.phase === "finished") break;

    // Computer may declare on void claim even when turnSeat is computer for place
    const canAct =
      engine.turnSeat === seat ||
      (engine.voidClaimOpen && engine.phase === "place_received") ||
      (engine.lastPlacerSeat === seat &&
        (engine.phase === "select_give" || engine.phase === "pie_choice") &&
        engine.pendingVoidSets.length > 0);

    if (!canAct && engine.turnSeat !== seat) break;

    const intent = chooseIntent(engine, seat, { difficulty: row.difficulty });
    if (!intent) break;

    const result = applyIntent(engine, seat, intent);
    if (!result.ok) break;

    await saveEngine(sessionId, result.state);
    events.push(...result.events);
    engine = result.state;
    if (engine.phase === "finished") break;
    if (engine.turnSeat !== seat) {
      // Still may need declare if we just placed — turnSeat stays placer after place
      if (
        engine.lastPlacerSeat === seat &&
        (engine.phase === "select_give" || engine.phase === "pie_choice")
      ) {
        continue;
      }
      break;
    }
  }
  return { events };
}

export { engineFromRow };
