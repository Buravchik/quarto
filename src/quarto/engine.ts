import { boardFull, isQuartoSet } from "./lines";
import { resolveModules } from "./modules/registry";
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
  turnNotifiedAt: string | null;
  /** Seat that just placed; may declare before giving. */
  lastPlacerSeat: 0 | 1 | null;
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
    turnNotifiedAt: null,
    lastPlacerSeat: null,
  };
}

export type ApplyResult =
  | { ok: true; state: EngineState; events: string[] }
  | { ok: false; error: string; state: EngineState };

function clone(state: EngineState): EngineState {
  return {
    ...state,
    board: [...state.board],
    pool: [...state.pool],
    voidedSets: state.voidedSets.map((s) => [...s]),
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
    // US3: full gating; US1 stub rejects early
    return { ok: false, error: "timeout_too_early", state };
  }

  if (intent.type === "pie_choice") {
    // US2
    return { ok: false, error: "not_implemented", state };
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
  if (intent.type === "declare") {
    return applyDeclare(state, seat, intent.setCells);
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
  next.lastPlacerSeat = null;
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
  next.board[cellIndex] = next.pieceInHand;
  next.pieceInHand = null;
  next.lastPlacerSeat = seat;
  next.firstPlaceDone = true;

  // Stay in place_received briefly for declare; caller may declare or give next.
  // Auto-advance to select_give for the placer (they give next piece).
  if (boardFull(next.board)) {
    next.phase = "finished";
    next.outcome = { type: "draw" };
    next.turnSeat = null;
    return { ok: true, state: next, events: ["match_ended"] };
  }

  next.phase = "select_give";
  next.turnSeat = seat;
  next.turnNotifiedAt = new Date().toISOString();
  return { ok: true, state: next, events: ["turn_changed"] };
}

function applyDeclare(state: EngineState, seat: 0 | 1, setCells: number[]): ApplyResult {
  // Legal only immediately after own place (lastPlacerSeat) while that seat still to give,
  // or still holding the turn after place transition.
  if (state.lastPlacerSeat !== seat) {
    return { ok: false, error: "illegal_declare", state };
  }
  if (state.phase !== "select_give" && state.phase !== "place_received") {
    return { ok: false, error: "illegal_declare", state };
  }
  if (!isQuartoSet(state.board, setCells, state.modules)) {
    return { ok: false, error: "illegal_declare", state };
  }

  const next = clone(state);
  next.phase = "finished";
  next.outcome = { type: "win", winnerSeat: seat, declaredSet: [...setCells] };
  next.turnSeat = null;
  return { ok: true, state: next, events: ["match_ended"] };
}
