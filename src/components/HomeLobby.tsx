"use client";

import { useState } from "react";
import { PieceToken } from "../pieces/PieceToken";
import { ExPrimaryButton, ExSurface } from "../theme/components";
import { Settings } from "./Settings";

type Props = {
  apiBase: string;
  initData: string;
  lang: string | undefined;
  copy: {
    appName: string;
    homeTagline: string;
    startMatch: string;
    homeHint: string;
    creating: string;
  };
  onStarted: (sessionId: string) => void;
};

const PREVIEW_IDS = ["p0", "p5", "pa", "pf"] as const;

export function HomeLobby({ apiBase, initData, copy, onStarted }: Props) {
  const [missMode, setMissMode] = useState<"persistent" | "void">("persistent");
  const [pieRule, setPieRule] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startMatch() {
    if (!apiBase) {
      setError("API base missing");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/cards`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          initData,
          surface: "dm",
          missMode,
          pieRule,
        }),
      });
      const data = (await res.json()) as {
        sessionId?: string;
        error?: string;
      };
      if (!res.ok || !data.sessionId) {
        setError(data.error ?? `create ${res.status}`);
        return;
      }
      onStarted(data.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1.15rem", maxWidth: "28rem" }}>
      <p className="ex-headline" style={{ fontWeight: 500, opacity: 0.95 }}>
        {copy.homeTagline}
      </p>

      <ExSurface emphasized>
        <div className="ex-piece-grid" aria-hidden>
          {PREVIEW_IDS.map((id) => (
            <PieceToken key={id} pieceId={id} size="md" decorative />
          ))}
        </div>
      </ExSurface>

      <Settings
        missMode={missMode}
        pieRule={pieRule}
        locked={false}
        disabled={busy}
        onChange={(next) => {
          setMissMode(next.missMode);
          setPieRule(next.pieRule);
        }}
      />

      <ExPrimaryButton disabled={busy || !initData} onClick={() => void startMatch()}>
        {busy ? copy.creating : copy.startMatch}
      </ExPrimaryButton>

      {error ? (
        <p className="ex-error">{error}</p>
      ) : (
        <p className="ex-muted" style={{ margin: 0, fontSize: "0.95rem" }}>
          {copy.homeHint}
        </p>
      )}
    </section>
  );
}
