import { applyIntent, type EngineState, type Intent } from "../engine";
import {
  availableDeclares,
  emptyCells,
  isUnsafeGift,
  pickRandom,
  safeGifts,
  winningCellsForPiece,
} from "./threats";

const NODE_BUDGET = 25_000;
const TIME_MS = 4_000;

type Ctx = { nodes: number; deadline: number };

function timedOut(ctx: Ctx): boolean {
  return ctx.nodes >= NODE_BUDGET || Date.now() >= ctx.deadline;
}

/**
 * Bounded exact look-ahead for late game. Returns best intent for `seat` or null to fall back.
 * Score: +1 win, -1 loss, 0 draw / unresolved under budget.
 */
export function expertChooseIntent(
  state: EngineState,
  seat: 0 | 1,
): Intent | null {
  const empties = emptyCells(state.board).length;
  if (empties > 6) return null;

  const ctx: Ctx = { nodes: 0, deadline: Date.now() + TIME_MS };
  const { intent } = negamaxRoot(state, seat, ctx);
  return intent;
}

function negamaxRoot(
  state: EngineState,
  seat: 0 | 1,
  ctx: Ctx,
): { intent: Intent | null; score: number } {
  const moves = legalIntents(state, seat);
  if (moves.length === 0) return { intent: null, score: 0 };

  let best: Intent | null = moves[0]!;
  let bestScore = -Infinity;
  for (const intent of moves) {
    if (timedOut(ctx)) break;
    const applied = applyIntent(state, seat, intent);
    if (!applied.ok) continue;
    ctx.nodes++;
    const score = -negamax(applied.state, seat === 0 ? 1 : 0, ctx, 1);
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }
  return { intent: best, score: bestScore };
}

function negamax(state: EngineState, seatToMove: 0 | 1, ctx: Ctx, depth: number): number {
  if (state.phase === "finished") {
    const o = state.outcome;
    if (!o) return 0;
    if (o.type === "draw") return 0;
    if (o.winnerSeat === seatToMove) return 1;
    // winner is the other seat relative to seatToMove at leaf — use absolute
    // At leaf, seatToMove is who would move; outcome.winnerSeat is absolute.
    // Caller already negated, so return from perspective of seatToMove's opponent... 
    // Standard: return score for the player who just moved? We return for current seatToMove.
    return o.winnerSeat === seatToMove ? 1 : -1;
  }
  if (timedOut(ctx) || depth > 12) return 0;

  const moves = legalIntents(state, seatToMove);
  if (moves.length === 0) return 0;

  let best = -Infinity;
  for (const intent of moves) {
    if (timedOut(ctx)) break;
    const applied = applyIntent(state, seatToMove, intent);
    if (!applied.ok) continue;
    ctx.nodes++;
    const score = -negamax(applied.state, seatToMove === 0 ? 1 : 0, ctx, depth + 1);
    if (score > best) best = score;
    if (best === 1) break;
  }
  return best === -Infinity ? 0 : best;
}

function legalIntents(state: EngineState, seat: 0 | 1): Intent[] {
  if (state.phase === "finished") return [];

  const decls = availableDeclares(state, seat);
  if (decls.length > 0) {
    return decls.map((setCells) => ({ type: "declare" as const, setCells }));
  }

  if (state.phase === "pie_choice" && state.turnSeat === seat) {
    return [
      { type: "pie_choice", pieTake: false },
      { type: "pie_choice", pieTake: true },
    ];
  }

  if (state.phase === "place_received" && state.turnSeat === seat && state.pieceInHand) {
    const wins = winningCellsForPiece(
      state.board,
      state.pieceInHand,
      state.modules,
      state.voidedSets,
    );
    const cells = wins.length > 0 ? wins : emptyCells(state.board);
    return cells.map((cellIndex) => ({ type: "place" as const, cellIndex }));
  }

  if (state.phase === "select_give" && state.turnSeat === seat) {
    const safe = safeGifts(state);
    const pool = safe.length > 0 ? safe : [...state.pool];
    // Cap branching for search
    const limited = pool.length > 8 ? pool.slice(0, 8) : pool;
    return limited.map((pieceId) => ({ type: "give" as const, pieceId }));
  }

  return [];
}

/** Prefer safe random among legal when search abstains. */
export function fallbackRandomLegal(state: EngineState, seat: 0 | 1): Intent | null {
  const moves = legalIntents(state, seat);
  // Prefer non-unsafe gives if mixed
  if (state.phase === "select_give") {
    const safe = moves.filter(
      (m) => m.type === "give" && !isUnsafeGift(state, m.pieceId),
    );
    const pick = pickRandom(safe.length ? safe : moves);
    return pick ?? null;
  }
  return pickRandom(moves) ?? null;
}
