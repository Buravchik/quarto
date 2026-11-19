import type { Phase } from "./engine";

/** Minimal slice pie needs — avoids circular import with engine. */
export type PieState = {
  phase: Phase;
  turnSeat: 0 | 1 | null;
  openerSeat: 0 | 1 | null;
  pieRule: boolean;
  pieResolved: boolean;
  board: (string | null)[];
  pool: string[];
  voidedSets: number[][];
  outcome: {
    type: "win" | "draw" | "resign" | "timeout";
    winnerSeat?: 0 | 1;
    declaredSet?: number[];
  } | null;
  turnNotifiedAt: string | null;
};

/** After first place with pieRule: second player (placer) chooses take/pass. */
export function shouldEnterPieChoice(
  state: Pick<PieState, "pieRule" | "pieResolved">,
  justCompletedFirstPlace: boolean,
): boolean {
  return state.pieRule && justCompletedFirstPlace && !state.pieResolved;
}

/**
 * Apply pie take/pass.
 * Pass — seating unchanged; placer gives next.
 * Take — placer becomes opener (first); original opener gives next.
 */
export function applyPieChoice<T extends PieState>(
  state: T,
  seat: 0 | 1,
  pieTake: boolean,
): { ok: true; state: T } | { ok: false; error: string } {
  if (state.phase !== "pie_choice") {
    return { ok: false, error: "wrong_phase" };
  }
  if (state.turnSeat !== seat) {
    return { ok: false, error: "not_your_turn" };
  }

  const next = {
    ...state,
    board: [...state.board],
    pool: [...state.pool],
    voidedSets: state.voidedSets.map((s) => [...s]),
    outcome: state.outcome ? { ...state.outcome } : null,
    pieResolved: true,
    phase: "select_give" as Phase,
  };

  if (pieTake) {
    next.openerSeat = seat;
    next.turnSeat = seat === 0 ? 1 : 0;
  } else {
    next.turnSeat = seat;
  }
  next.turnNotifiedAt = new Date().toISOString();
  return { ok: true, state: next as T };
}
