"use client";

import { PieceToken } from "../pieces/PieceToken";

type Props = {
  pool: string[];
  moduleId?: string;
  selected?: string | null;
  onSelect?: (pieceId: string) => void;
  disabled?: boolean;
  pieceLabel?: (pieceId: string) => string;
};

export function Pool({
  pool,
  moduleId = "classic4",
  selected,
  onSelect,
  disabled,
  pieceLabel,
}: Props) {
  return (
    <div className="ex-piece-grid" role="list">
      {pool.map((id) => {
        const isSelected = selected === id;
        return (
          <button
            key={id}
            type="button"
            role="listitem"
            className={`ex-token-btn ${isSelected ? "ex-token-btn--selected" : ""}`.trim()}
            disabled={disabled}
            onClick={() => onSelect?.(id)}
            aria-label={pieceLabel?.(id) ?? id}
            aria-pressed={isSelected}
          >
            <PieceToken
              pieceId={id}
              moduleId={moduleId}
              size="sm"
              emphasis={isSelected ? "selected" : "none"}
              label={pieceLabel?.(id)}
            />
          </button>
        );
      })}
    </div>
  );
}
