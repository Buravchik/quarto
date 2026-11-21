import { applyIntent, type EngineState, type Intent } from "../engine";
import { canDeclareSet, completedSetsThrough } from "../miss";
import { isQuartoSet } from "../lines";
import { resolveModules } from "../modules/registry";

/** Legal declare sets available to `seat` right now (placer window or void claim). */
export function availableDeclares(state: EngineState, seat: 0 | 1): number[][] {
  const candidates: number[][] = [];
  if (state.pendingVoidSets.length > 0) {
    candidates.push(...state.pendingVoidSets);
  } else if (state.lastPlacedCell != null) {
    candidates.push(...completedSetsThrough(state.board, state.lastPlacedCell, state.modules));
  }

  const out: number[][] = [];
  for (const setCells of candidates) {
    const probe = applyIntent(state, seat, { type: "declare", setCells });
    if (probe.ok) out.push([...setCells]);
  }
  // Also try any win-set that canDeclareSet allows (in case pending empty but legal)
  if (out.length === 0 && state.lastPlacedCell != null) {
    const mod = resolveModules(state.modules);
    for (const win of mod.boardLayout.winSets) {
      const setCells = win.map(Number);
      if (
        canDeclareSet({
          missMode: state.missMode,
          board: state.board,
          setCells,
          lastPlacedCell: state.lastPlacedCell,
          voidedSets: state.voidedSets,
          modules: state.modules,
        })
      ) {
        const probe = applyIntent(state, seat, { type: "declare", setCells });
        if (probe.ok) out.push(setCells);
      }
    }
  }
  return out;
}

/** Empty cells where placing `pieceId` completes a Quarto set. */
export function winningCellsForPiece(
  board: (string | null)[],
  pieceId: string,
  modules?: string[],
  voidedSets: number[][] = [],
): number[] {
  const mod = resolveModules(modules);
  const cells: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== null) continue;
    const next = [...board];
    next[i] = pieceId;
    for (const win of mod.boardLayout.winSets) {
      const setCells = win.map(Number);
      if (!setCells.includes(i)) continue;
      if (!isQuartoSet(next, setCells, modules)) continue;
      const key = [...setCells].sort((a, b) => a - b).join(",");
      if (voidedSets.some((v) => [...v].sort((a, b) => a - b).join(",") === key)) continue;
      cells.push(i);
      break;
    }
  }
  return cells;
}

/** True if giving `pieceId` lets the opponent place an immediate Quarto somewhere. */
export function isUnsafeGift(state: EngineState, pieceId: string): boolean {
  return winningCellsForPiece(state.board, pieceId, state.modules, state.voidedSets).length > 0;
}

export function safeGifts(state: EngineState): string[] {
  return state.pool.filter((id) => !isUnsafeGift(state, id));
}

export function emptyCells(board: (string | null)[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < board.length; i++) if (board[i] === null) out.push(i);
  return out;
}

/** After a hypothetical place+optional later give, count safe gifts left in pool for opponent. */
export function scorePlaceGive(
  state: EngineState,
  seat: 0 | 1,
  placeCell: number,
  givePieceId: string | null,
): number | null {
  const place = applyIntent(state, seat, { type: "place", cellIndex: placeCell });
  if (!place.ok) return null;
  let s = place.state;
  // Prefer declaring if we just created a win
  const decls = availableDeclares(s, seat);
  if (decls[0]) {
    return 10_000; // immediate win path after place (declare next)
  }
  if (givePieceId) {
    const give = applyIntent(s, seat, { type: "give", pieceId: givePieceId });
    if (!give.ok) return null;
    s = give.state;
  }
  const oppSafe = safeGifts(s).length;
  // Higher is better for us: fewer safe gifts for opponent
  return 100 - oppSafe;
}

export function pickRandom<T>(items: T[], rng: () => number = Math.random): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(rng() * items.length)]!;
}

export type { Intent };
