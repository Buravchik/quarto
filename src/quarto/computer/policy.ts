import { applyIntent, type EngineState, type Intent } from "../engine";
import type { Difficulty } from "./types";
import { expertChooseIntent, fallbackRandomLegal } from "./search";
import {
  availableDeclares,
  emptyCells,
  isUnsafeGift,
  pickRandom,
  safeGifts,
  scorePlaceGive,
  winningCellsForPiece,
} from "./threats";

export type ChooseOpts = {
  difficulty: Difficulty;
  /** Injected RNG for tests */
  rng?: () => number;
};

/**
 * Choose one legal intent for the computer seat.
 * Never returns resign/claim_timeout.
 */
export function chooseIntent(
  state: EngineState,
  seat: 0 | 1,
  opts: ChooseOpts,
): Intent | null {
  const rng = opts.rng ?? Math.random;
  const d = opts.difficulty;

  if (state.phase === "finished") return null;

  // Pie: always pass (no opening theory)
  if (state.phase === "pie_choice" && state.turnSeat === seat) {
    return { type: "pie_choice", pieTake: false };
  }

  const takeWins = d !== "easy" || rng() > 0.4;
  const avoidGift = d !== "easy" || rng() > 0.4;

  // Immediate declare / Miss claim
  if (takeWins) {
    const decls = availableDeclares(state, seat);
    if (decls[0]) return { type: "declare", setCells: decls[0]! };
  }

  if (state.phase === "place_received" && state.turnSeat === seat && state.pieceInHand) {
    return choosePlace(state, seat, d, takeWins, rng);
  }

  if (state.phase === "select_give" && state.turnSeat === seat) {
    return chooseGive(state, seat, d, avoidGift, rng);
  }

  return fallbackRandomLegal(state, seat);
}

function choosePlace(
  state: EngineState,
  seat: 0 | 1,
  d: Difficulty,
  takeWins: boolean,
  rng: () => number,
): Intent {
  const piece = state.pieceInHand!;
  const wins = winningCellsForPiece(state.board, piece, state.modules, state.voidedSets);
  if (takeWins && wins[0] != null) {
    return { type: "place", cellIndex: wins[0]! };
  }

  if (d === "expert") {
    const searched = expertChooseIntent(state, seat);
    if (searched) return searched;
  }

  const cells = emptyCells(state.board);
  if (d === "hard" || d === "expert") {
    let bestCell = cells[0] ?? 0;
    let best = -Infinity;
    for (const cell of cells) {
      // Score by best follow-up safe give
      const safes = (() => {
        const placed = applyIntent(state, seat, { type: "place", cellIndex: cell });
        if (!placed.ok) return [] as string[];
        if (availableDeclares(placed.state, seat).length > 0) return ["__win__"];
        return safeGifts(placed.state);
      })();
      const score =
        safes[0] === "__win__"
          ? 10_000
          : safes.length > 0
            ? 100 + safes.length
            : scorePlaceGive(state, seat, cell, null) ?? -1;
      if (score > best) {
        best = score;
        bestCell = cell;
      }
    }
    return { type: "place", cellIndex: bestCell };
  }

  return { type: "place", cellIndex: pickRandom(cells, rng) ?? 0 };
}

function chooseGive(
  state: EngineState,
  seat: 0 | 1,
  d: Difficulty,
  avoidGift: boolean,
  rng: () => number,
): Intent {
  if (d === "expert") {
    const searched = expertChooseIntent(state, seat);
    if (searched) return searched;
  }

  const safe = safeGifts(state);
  const pool = state.pool;

  if (avoidGift && safe.length > 0) {
    if (d === "hard" || d === "expert") {
      // Prefer gifts that leave fewer safe replies — already giving safe; pick random among safe
      // Optionally bias toward pieces that create pressure: fewer cells? keep simple.
      return { type: "give", pieceId: pickRandom(safe, rng)! };
    }
    return { type: "give", pieceId: pickRandom(safe, rng)! };
  }

  // No safe gift or Easy skipping filter
  if (pool.length === 0) {
    return fallbackRandomLegal(state, seat) ?? { type: "resign" };
  }
  // Still try not to pick unsafe on Normal+ if avoidGift failed only because empty safe — forced
  const pick = pickRandom(pool, rng)!;
  if (avoidGift && safe.length === 0 && isUnsafeGift(state, pick)) {
    // All unsafe — any legal
    return { type: "give", pieceId: pick };
  }
  return { type: "give", pieceId: pick };
}
