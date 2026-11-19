import type { GameModule } from "./types";

const TRAIT_COUNT = 4;
const pieceIds: string[] = [];
const traits: Record<string, number> = {};

for (let i = 0; i < 1 << TRAIT_COUNT; i++) {
  const id = `p${i.toString(16)}`;
  pieceIds.push(id);
  traits[id] = i;
}

const cellIds = Array.from({ length: 16 }, (_, i) => String(i));

function line(cells: number[]): string[] {
  return cells.map(String);
}

const winSets: string[][] = [
  // rows
  line([0, 1, 2, 3]),
  line([4, 5, 6, 7]),
  line([8, 9, 10, 11]),
  line([12, 13, 14, 15]),
  // cols
  line([0, 4, 8, 12]),
  line([1, 5, 9, 13]),
  line([2, 6, 10, 14]),
  line([3, 7, 11, 15]),
  // diags
  line([0, 5, 10, 15]),
  line([3, 6, 9, 12]),
];

export const classic4: GameModule = {
  id: "classic4",
  conflictGroup: "board",
  pieceSet: {
    traitCount: TRAIT_COUNT,
    pieceIds,
    traits,
  },
  boardLayout: {
    id: "grid4x4",
    cellCount: 16,
    cellIds,
    winSets,
  },
};
