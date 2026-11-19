import { boardFull } from "./lines";
import {
  canDeclareSet,
  completedSetsThrough,
  voidSets,
} from "./miss";
import { resolveModules } from "./modules/registry";
import { applyPieChoice, shouldEnterPieChoice } from "./pie";
import { canClaimTimeout } from "./timeout";
import type { MissMode } from "./types";

export type Phase = "waiting" | "select_give" | "place_received" | "pie_choice" | "finished";

export type Intent =
  | { type: "give"; pieceId: string }
  | { type: "place"; cellIndex: number }
  | { type: "declare"; setCells: number[] }
  | { type: "pie_choice"; pieTake: boolean }
  | { type: "resign" }
  | { type: "claim_timeout" };

export type EngineState = {
  modules: string[];
  missMode: MissMode;
  pieRule: boolean;
  settingsLocked: boolean;
  phase: Phase;
  board: (string | null)[];
  pool: string[];
  pieceInHand: string | null;
  turnSeat: 0 | 1 | null;
  openerSeat: 0 | 1 | null;
  voidedSets: number[][];
  outcome: null | {
    type: "win" | "draw" | "resign" | "timeout";
    winnerSeat?: 0 | 1;
    declaredSet?: number[];
  };
  firstPlaceDone: boolean;
  pieResolved: boolean;
  turnNotifiedAt: string | null;
  /** Seat that just placed; may declare before giving (Persistent / Void placer window). */
  lastPlacerSeat: 0 | 1 | null;
  /** Cell index of last placement (declare must include this cell). */
  lastPlacedCell: number | null;
  /**
   * Void: after placer gave without declaring, receiver may claim through
   * lastPlacedCell before placing.
   */
  voidClaimOpen: boolean;
  /** Sets completed by last place; voided when opponent places without claiming (Void). */
  pendingVoidSets: number[][];
};

export function createInitialState(opts?: {
  modules?: string[];
  missMode?: MissMode;
  pieRule?: boolean;
}): EngineState {
  const mod = resolveModules(opts?.modules);
  return {
    modules: [mod.id],
    missMode: opts?.missMode ?? "persistent",
    pieRule: opts?.pieRule ?? false,
    settingsLocked: false,
    phase: "waiting",
    board: Array(mod.boardLayout.cellCount).fill(null),
    pool: [...mod.pieceSet.pieceIds],
    pieceInHand: null,
    turnSeat: null,
    openerSeat: null,
    voidedSets: [],
    outcome: null,
    firstPlaceDone: false,
    pieResolved: false,
    turnNotifiedAt: null,
    lastPlacerSeat: null,
    lastPlacedCell: null,
    voidClaimOpen: false,
    pendingVoidSets: [],
  };
}

export type ApplyResult =
  | { ok: true; state: EngineState; events: string[] }
  | { ok: false; error: string; state: EngineState; retryAfterSeconds?: number };

function clone(state: EngineState): EngineState {
  return {
    ...state,
    board: [...state.board],
    pool: [...state.pool],
    voidedSets: state.voidedSets.map((s) => [...s]),
    pendingVoidSets: state.pendingVoidSets.map((s) => [...s]),
    outcome: state.outcome ? { ...state.outcome } : null,
  };
}

/** After both seats join: lock settings, pick opener, start give phase. */
export function startMatch(state: EngineState, openerSeat: 0 | 1 = Math.random() < 0.5 ? 0 : 1): EngineState {
  const next = clone(state);
  next.settingsLocked = true;
  next.openerSeat = openerSeat;
  next.turnSeat = openerSeat;
  next.phase = "select_give";
  next.turnNotifiedAt = new Date().toISOString();
  next.lastPlacerSeat = null;
  next.lastPlacedCell = null;
  next.voidClaimOpen = false;
  next.pendingVoidSets = [];
  next.pieResolved = !next.pieRule;
  return next;
}

export function applyIntent(state: EngineState, seat: 0 | 1, intent: Intent): ApplyResult {
  if (state.phase === "finished") {
    return { ok: false, error: "wrong_phase", state };
  }

  if (intent.type === "resign") {
    if (state.phase === "waiting") return { ok: false, error: "wrong_phase", state };
    const next = clone(state);
    next.phase = "finished";
    next.outcome = { type: "resign", winnerSeat: seat === 0 ? 1 : 0 };
    next.turnSeat = null;
    return { ok: true, state: next, events: ["match_ended"] };
  }

  if (intent.type === "claim_timeout") {
    const gate = canClaimTimeout({
      turnSeat: state.turnSeat,
      claimingSeat: seat,
      turnNotifiedAt: state.turnNotifiedAt,
      phase: state.phase,
    });
    if (!gate.ok) {
      return {
        ok: false,
        error: gate.error,
        state,
        retryAfterSeconds: gate.retryAfterSeconds,
      };
    }
    const next = clone(state);
    next.phase = "finished";
    next.outcome = { type: "timeout", winnerSeat: seat };
    next.turnSeat = null;
    return { ok: true, state: next, events: ["match_ended"] };
  }

  if (intent.type === "pie_choice") {
    const result = applyPieChoice(state, seat, intent.pieTake);
    if (!result.ok) return { ok: false, error: result.error, state };
    return { ok: true, state: result.state, events: ["turn_changed"] };
  }

  if (intent.type === "declare") {
    return applyDeclare(state, seat, intent.setCells);
  }

  if (state.turnSeat !== null && state.turnSeat !== seat) {
    return { ok: false, error: "not_your_turn", state };
  }

  if (intent.type === "give") {
    return applyGive(state, seat, intent.pieceId);
  }
  if (intent.type === "place") {
    return applyPlace(state, seat, intent.cellIndex);
  }

  return { ok: false, error: "not_implemented", state };
}

function applyGive(state: EngineState, seat: 0 | 1, pieceId: string): ApplyResult {
  if (state.phase !== "select_give") {
    return { ok: false, error: "wrong_phase", state };
  }
  if (state.turnSeat !== seat) {
    return { ok: false, error: "not_your_turn", state };
  }
  if (state.pieceInHand) {
    return { ok: false, error: "illegal_move", state };
  }
  const idx = state.pool.indexOf(pieceId);
  if (idx < 0) {
    return { ok: false, error: "illegal_move", state };
  }

  const next = clone(state);
  next.pool.splice(idx, 1);
  next.pieceInHand = pieceId;
  next.phase = "place_received";
  next.turnSeat = seat === 0 ? 1 : 0;
  next.turnNotifiedAt = new Date().toISOString();

  // Void: if placer hands off without declaring, opponent may claim before place
  if (next.missMode === "void" && next.lastPlacerSeat === seat && next.pendingVoidSets.length > 0) {
    next.voidClaimOpen = true;
  } else {
    next.voidClaimOpen = false;
  }
  // Giving ends placer declare window for Persistent
  if (next.missMode === "persistent") {
    next.lastPlacerSeat = null;
  }
  return { ok: true, state: next, events: ["turn_changed"] };
}

function applyPlace(state: EngineState, seat: 0 | 1, cellIndex: number): ApplyResult {
  if (state.phase !== "place_received") {
    return { ok: false, error: "wrong_phase", state };
  }
  if (state.turnSeat !== seat) {
    return { ok: false, error: "not_your_turn", state };
  }
  if (!state.pieceInHand) {
    return { ok: false, error: "illegal_move", state };
  }
  if (cellIndex < 0 || cellIndex >= state.board.length || state.board[cellIndex] !== null) {
    return { ok: false, error: "illegal_move", state };
  }

  const next = clone(state);

  // Void: placing without claiming kills pending sets from previous place
  if (next.missMode === "void" && next.voidClaimOpen && next.pendingVoidSets.length > 0) {
    next.voidedSets = voidSets(next.voidedSets, next.pendingVoidSets);
  }
  next.voidClaimOpen = false;
  next.pendingVoidSets = [];

  next.board[cellIndex] = next.pieceInHand;
  next.pieceInHand = null;
  next.lastPlacerSeat = seat;
  next.lastPlacedCell = cellIndex;

  const wasFirst = !next.firstPlaceDone;
  next.firstPlaceDone = true;

  if (boardFull(next.board)) {
    next.phase = "finished";
    next.outcome = { type: "draw" };
    next.turnSeat = null;
    return { ok: true, state: next, events: ["match_ended"] };
  }

  if (shouldEnterPieChoice(next, wasFirst)) {
    next.phase = "pie_choice";
    next.turnSeat = seat;
    next.turnNotifiedAt = new Date().toISOString();
    next.pendingVoidSets = completedSetsThrough(next.board, cellIndex, next.modules);
    return { ok: true, state: next, events: ["turn_changed"] };
  }

  next.pendingVoidSets = completedSetsThrough(next.board, cellIndex, next.modules);
  next.phase = "select_give";
  next.turnSeat = seat;
  next.turnNotifiedAt = new Date().toISOString();
  return { ok: true, state: next, events: ["turn_changed"] };
}

function applyDeclare(state: EngineState, seat: 0 | 1, setCells: number[]): ApplyResult {
  const next = clone(state);

  // Persistent: only immediately after own place
  if (next.missMode === "persistent") {
    if (next.lastPlacerSeat !== seat) {
      return { ok: false, error: "illegal_declare", state };
    }
    if (next.phase !== "select_give" && next.phase !== "pie_choice") {
      return { ok: false, error: "illegal_declare", state };
    }
  } else {
    // Void: placer after own place, OR receiver while voidClaimOpen before place
    const placerWindow =
      next.lastPlacerSeat === seat &&
      (next.phase === "select_give" || next.phase === "pie_choice");
    const receiverWindow =
      next.voidClaimOpen &&
      next.phase === "place_received" &&
      next.turnSeat === seat &&
      next.lastPlacerSeat !== seat;
    if (!placerWindow && !receiverWindow) {
      return { ok: false, error: "illegal_declare", state };
    }
  }

  if (
    !canDeclareSet({
      missMode: next.missMode,
      board: next.board,
      setCells,
      lastPlacedCell: next.lastPlacedCell,
      voidedSets: next.voidedSets,
      modules: next.modules,
    })
  ) {
    return { ok: false, error: "illegal_declare", state };
  }

  next.phase = "finished";
  next.outcome = { type: "win", winnerSeat: seat, declaredSet: [...setCells] };
  next.turnSeat = null;
  next.voidClaimOpen = false;
  next.pendingVoidSets = [];
  return { ok: true, state: next, events: ["match_ended"] };
}
