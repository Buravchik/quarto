"use client";

import { PieceToken } from "../pieces/PieceToken";

type Props = {
  board: (string | null)[];
  moduleId?: string;
  onCell?: (index: number) => void;
  disabled?: boolean;
  declareCells?: number[];
  /** When true, occupied cells stay clickable (declare selection). */
  selectableOccupied?: boolean;
  pieceLabel?: (pieceId: string) => string;
};

export function Board({
  board,
  moduleId = "classic4",
  onCell,
  disabled,
  declareCells = [],
  selectableOccupied = false,
  pieceLabel,
}: Props) {
  return (
    <div className="ex-board" role="grid" aria-label="Quarto board">
      {board.map((piece, i) => {
        const occupied = !!piece;
        const declaring = declareCells.includes(i);
        const cellDisabled = disabled || (occupied && !selectableOccupied);
        return (
          <button
            key={i}
            type="button"
            className={`ex-cell ${occupied ? "ex-cell--occupied" : ""} ${declaring ? "ex-cell--declare" : ""}`.trim()}
            disabled={cellDisabled}
            onClick={() => onCell?.(i)}
            aria-label={occupied ? pieceLabel?.(piece!) ?? piece! : `Empty cell ${i + 1}`}
          >
            {piece ? (
              <PieceToken pieceId={piece} moduleId={moduleId} size="md" label={pieceLabel?.(piece)} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
