"use client";

import { useCallback, useEffect, useState } from "react";
import { Board } from "./Board";
import { Pool } from "./Pool";

type Snapshot = {
  sessionId: string;
  status: string;
  phase: string;
  board: (string | null)[];
  pool: string[];
  pieceInHand: string | null;
  turnSeat: 0 | 1 | null;
  outcome: { type: string; winnerSeat?: number } | null;
  seat0: { telegramUserId: string } | null;
  seat1: { telegramUserId: string } | null;
};

type Props = {
  apiBase: string;
  sessionId: string;
  initData: string;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData?: string; ready?: () => void } };
  }
}

export function GamePanel({ apiBase, sessionId, initData }: Props) {
  const [session, setSession] = useState<Snapshot | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [declareCells, setDeclareCells] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const url = `${apiBase}/api/v1/sessions/${sessionId}?initData=${encodeURIComponent(initData)}`;
    const res = await fetch(url);
    if (!res.ok) {
      setError(`load ${res.status}`);
      return;
    }
    setSession((await res.json()) as Snapshot);
    setError(null);
  }, [apiBase, sessionId, initData]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function sendIntent(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/sessions/${sessionId}/intent`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData, ...body }),
      });
      const data = (await res.json()) as { session?: Snapshot; error?: string };
      if (!res.ok) {
        setError(data.error ?? `intent ${res.status}`);
        return;
      }
      if (data.session) setSession(data.session);
      setSelectedPiece(null);
      setDeclareCells([]);
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/sessions/${sessionId}/join`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      const data = (await res.json()) as Snapshot & { error?: string };
      if (!res.ok) {
        setError(data.error ?? `join ${res.status}`);
        return;
      }
      setSession(data);
    } finally {
      setBusy(false);
    }
  }

  function toggleDeclare(i: number) {
    setDeclareCells((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : prev.length < 4 ? [...prev, i] : prev,
    );
  }

  if (!session) {
    return (
      <section>
        <p>{error ?? "Loading session…"}</p>
      </section>
    );
  }

  const canGive = session.phase === "select_give" && !session.pieceInHand;
  const canPlace = session.phase === "place_received" && !!session.pieceInHand;
  const canDeclare = session.phase === "select_give" || session.phase === "place_received";

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <p style={{ margin: 0 }}>
        {session.status} · {session.phase}
        {session.pieceInHand ? ` · hand ${session.pieceInHand}` : ""}
        {session.outcome ? ` · ${session.outcome.type}` : ""}
      </p>
      {error ? <p style={{ color: "#e07070", margin: 0 }}>{error}</p> : null}

      {session.status === "waiting" ? (
        <button type="button" disabled={busy} onClick={() => void join()}>
          Join as seat 1
        </button>
      ) : null}

      <Board
        board={session.board}
        disabled={busy || !canPlace}
        onCell={(i) => {
          if (canPlace) void sendIntent({ type: "place", cellIndex: i });
          else if (canDeclare) toggleDeclare(i);
        }}
      />

      <div>
        <h2 style={{ fontSize: "1rem", margin: "0 0 0.4rem" }}>Pool</h2>
        <Pool
          pool={session.pool}
          selected={selectedPiece}
          disabled={busy || !canGive}
          onSelect={setSelectedPiece}
        />
        {canGive ? (
          <button
            type="button"
            disabled={busy || !selectedPiece}
            style={{ marginTop: "0.5rem" }}
            onClick={() => selectedPiece && void sendIntent({ type: "give", pieceId: selectedPiece })}
          >
            Give selected
          </button>
        ) : null}
      </div>

      {canDeclare ? (
        <div>
          <p style={{ margin: "0 0 0.4rem" }}>Declare cells: {declareCells.join(",") || "—"}</p>
          <button
            type="button"
            disabled={busy || declareCells.length !== 4}
            onClick={() => void sendIntent({ type: "declare", setCells: declareCells })}
          >
            Declare Quarto
          </button>
        </div>
      ) : null}

      <button type="button" disabled={busy || session.status !== "active"} onClick={() => void sendIntent({ type: "resign" })}>
        Resign
      </button>
    </section>
  );
}
