import { resolveModules } from "./modules/registry";

/** True if the four cells share at least one trait bit across all occupied pieces. */
export function isQuartoSet(
  board: (string | null)[],
  cells: number[],
  modules?: string[],
): boolean {
  if (cells.length !== 4) return false;
  const uniq = new Set(cells);
  if (uniq.size !== 4) return false;

  const mod = resolveModules(modules);
  const pieces: number[] = [];
  for (const i of cells) {
    if (i < 0 || i >= board.length) return false;
    const id = board[i];
    if (!id) return false;
    const t = mod.pieceSet.traits[id];
    if (t === undefined) return false;
    pieces.push(t);
  }

  const cellIds = cells.map(String);
  const allowed = mod.boardLayout.winSets.some(
    (set) => set.length === 4 && set.every((c) => cellIds.includes(c)),
  );
  if (!allowed) return false;

  let shared = pieces[0]!;
  for (let i = 1; i < pieces.length; i++) {
    shared &= pieces[i]!;
  }
  // Also check shared absence of bits (all 0 on a trait): Quarto = all same on a trait
  // For binary traits, all same means AND of bits OR AND of inverted bits.
  let sharedAbsent = ~pieces[0]!;
  for (let i = 1; i < pieces.length; i++) {
    sharedAbsent &= ~pieces[i]!;
  }
  const mask = (1 << mod.pieceSet.traitCount) - 1;
  return (shared & mask) !== 0 || (sharedAbsent & mask) !== 0;
}

export function boardFull(board: (string | null)[]): boolean {
  return board.every((c) => c !== null);
}
