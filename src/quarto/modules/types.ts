export type BoardLayout = {
  id: string;
  cellCount: number;
  /** Cell ids in render/order order; classic4 uses "0".."15". */
  cellIds: string[];
  /** Winning sets as lists of cell ids. */
  winSets: string[][];
};

export type PieceSet = {
  traitCount: number;
  pieceIds: string[];
  /** Bitmask traits per piece id for classic-style modules. */
  traits: Record<string, number>;
};

export type GameModule = {
  id: string;
  conflictGroup?: string;
  pieceSet: PieceSet;
  boardLayout: BoardLayout;
};
