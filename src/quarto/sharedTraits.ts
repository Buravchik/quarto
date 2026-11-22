import { getChannelMap } from "../pieces/registry";
import { resolveModules } from "./modules/registry";

/** i18n keys for each shared trait on a four-cell Quarto set (Q2=A: all). */
export function sharedTraitLabelKeys(
  board: (string | null)[],
  cells: number[],
  modules?: string[],
): string[] {
  if (cells.length !== 4) return [];
  const uniq = new Set(cells);
  if (uniq.size !== 4) return [];

  const mod = resolveModules(modules);
  const pieces: number[] = [];
  for (const i of cells) {
    if (i < 0 || i >= board.length) return [];
    const id = board[i];
    if (!id) return [];
    const t = mod.pieceSet.traits[id];
    if (t === undefined) return [];
    pieces.push(t);
  }

  let shared = pieces[0]!;
  let sharedAbsent = ~pieces[0]!;
  for (let i = 1; i < pieces.length; i++) {
    shared &= pieces[i]!;
    sharedAbsent &= ~pieces[i]!;
  }

  const traitCount = mod.pieceSet.traitCount;
  const mask = (1 << traitCount) - 1;
  shared &= mask;
  sharedAbsent &= mask;

  const moduleId = mod.id || "classic4";
  const channels = getChannelMap(moduleId).channels;
  const keys: string[] = [];
  for (const ch of channels) {
    const bit = 1 << ch.bitIndex;
    if (shared & bit) keys.push(ch.trueLabelKey);
    else if (sharedAbsent & bit) keys.push(ch.falseLabelKey);
  }
  return keys;
}
