"use client";

type Props = {
  board: (string | null)[];
  onCell?: (index: number) => void;
  disabled?: boolean;
};

export function Board({ board, onCell, disabled }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 3rem)",
        gap: "0.35rem",
      }}
    >
      {board.map((piece, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled || !!piece}
          onClick={() => onCell?.(i)}
          style={{
            width: "3rem",
            height: "3rem",
            border: "1px solid #335",
            background: piece ? "#1a3a4a" : "#0d1b24",
            color: "#e8d5a3",
            fontSize: "0.7rem",
          }}
        >
          {piece ?? ""}
        </button>
      ))}
    </div>
  );
}
