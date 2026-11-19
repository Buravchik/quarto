import { isQuartoSet } from "./lines";
import { resolveModules } from "./modules/registry";
import type { MissMode } from "./types";

/** True if setCells is a legal declare under Miss rules for the just-played cell. */
export function canDeclareSet(opts: {
  missMode: MissMode;
  board: (string | null)[];
  setCells: number[];
  lastPlacedCell: number | null;
  voidedSets: number[][];
  modules?: string[];
}): boolean {
  const { missMode, board, setCells, lastPlacedCell, voidedSets, modules } = opts;
  if (lastPlacedCell == null) return false;
  if (!setCells.includes(lastPlacedCell)) return false;
  if (isVoided(setCells, voidedSets)) return false;
  if (!isQuartoSet(board, setCells, modules)) return false;

  if (missMode === "void") {
    // Void: only lines through the cell just played (already enforced via includes)
    return true;
  }
  // Persistent: same cell-through rule after own place
  return true;
}

export function isVoided(setCells: number[], voidedSets: number[][]): boolean {
  const key = normalizeSet(setCells);
  return voidedSets.some((v) => normalizeSet(v) === key);
}

export function normalizeSet(cells: number[]): string {
  return [...cells].sort((a, b) => a - b).join(",");
}

/** Completed win-lines through `cell` on the current board. */
export function completedSetsThrough(
  board: (string | null)[],
  cell: number,
  modules?: string[],
): number[][] {
  const mod = resolveModules(modules);
  const out: number[][] = [];
  for (const win of mod.boardLayout.winSets) {
    const cells = win.map(Number);
    if (!cells.includes(cell)) continue;
    if (isQuartoSet(board, cells, modules)) out.push(cells);
  }
  return out;
}

/** Merge newly dead sets into voidedSets (Void miss). */
export function voidSets(voidedSets: number[][], toVoid: number[][]): number[][] {
  const next = voidedSets.map((s) => [...s]);
  const seen = new Set(next.map(normalizeSet));
  for (const set of toVoid) {
    const key = normalizeSet(set);
    if (seen.has(key)) continue;
    seen.add(key);
    next.push([...set]);
  }
  return next;
}
