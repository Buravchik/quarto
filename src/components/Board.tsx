"use client";

import { PieceToken } from "../pieces/PieceToken";

type Props = {
  board: (string | null)[];
  moduleId?: string;
  onCell?: (index: number) => void;
  disabled?: boolean;
  declareCells?: number[];
  /** Soft highlight for legal hint lines (010). */
  hintCells?: number[];
  /** Computer last place (017) — vs-computer only. */
  lastMoveCell?: number | null;
  /** Declared Quarto cells after a validated win (017). */
  winCells?: number[];
  /** When true, occupied cells stay clickable (declare selection). */
  selectableOccupied?: boolean;
  /** When true, empty cells stay clickable (place). */
  selectableEmpty?: boolean;
  pieceLabel?: (pieceId: string) => string;
};

export function Board({
  board,
  moduleId = "classic4",
  onCell,
  disabled,
  declareCells = [],
  hintCells = [],
  lastMoveCell = null,
  winCells = [],
  selectableOccupied = false,
  selectableEmpty = false,
  pieceLabel,
}: Props) {
  return (
    <div className="ex-board" role="grid" aria-label="Quarto board">
      {board.map((piece, i) => {
        const occupied = !!piece;
        const declaring = declareCells.includes(i);
        const winning = !declaring && winCells.includes(i);
        const lastMove = !declaring && !winning && lastMoveCell === i;
        const hinted = !declaring && !winning && !lastMove && hintCells.includes(i);
        const cellDisabled =
          disabled ||
          (occupied ? !selectableOccupied : !selectableEmpty);
        return (
          <button
            key={i}
            type="button"
            className={`ex-cell ${occupied ? "ex-cell--occupied" : ""} ${declaring ? "ex-cell--declare" : ""} ${winning ? "ex-cell--win" : ""} ${lastMove ? "ex-cell--last-move" : ""} ${hinted ? "ex-cell--hint" : ""}`.trim()}
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
