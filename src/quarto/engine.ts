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
  };
}

export type ApplyResult =
  | { ok: true; state: EngineState; events: string[] }
  | { ok: false; error: string; state: EngineState };

/** Pure transition stub — full classic rules filled in US1–US3 tasks. */
export function applyIntent(state: EngineState, seat: 0 | 1, intent: Intent): ApplyResult {
  if (state.phase === "finished") {
    return { ok: false, error: "wrong_phase", state };
  }
  if (state.turnSeat !== null && state.turnSeat !== seat && intent.type !== "claim_timeout") {
    return { ok: false, error: "not_your_turn", state };
  }
  // Placeholder: reject unknown until US1 implements give/place/declare.
  void intent;
  return { ok: false, error: "not_implemented", state };
}
