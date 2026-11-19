"use client";

type Props = {
  pool: string[];
  selected?: string | null;
  onSelect?: (pieceId: string) => void;
  disabled?: boolean;
};

export function Pool({ pool, selected, onSelect, disabled }: Props) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", maxWidth: "20rem" }}>
      {pool.map((id) => (
        <button
          key={id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect?.(id)}
          style={{
            minWidth: "2.4rem",
            padding: "0.35rem 0.4rem",
            border: selected === id ? "2px solid #c9a227" : "1px solid #335",
            background: "#122430",
            color: "#e8d5a3",
            fontSize: "0.75rem",
          }}
        >
          {id}
        </button>
      ))}
    </div>
  );
}
