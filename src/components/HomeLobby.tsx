"use client";

import { useState } from "react";
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
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        maxWidth: "28rem",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "1.15rem",
          lineHeight: 1.45,
          opacity: 0.92,
        }}
      >
        {copy.homeTagline}
      </p>

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

      <button
        type="button"
        disabled={busy || !initData}
        onClick={() => void startMatch()}
        style={{
          fontFamily: "inherit",
          fontSize: "1.15rem",
          padding: "0.85rem 1.1rem",
          border: "none",
          borderRadius: "2px",
          background: "#c49a2a",
          color: "#0b1520",
          fontWeight: 700,
          cursor: busy ? "wait" : "pointer",
        }}
      >
        {busy ? copy.creating : copy.startMatch}
      </button>

      {error ? (
        <p style={{ margin: 0, color: "#e07070" }}>{error}</p>
      ) : (
        <p style={{ margin: 0, opacity: 0.65, fontSize: "0.95rem" }}>{copy.homeHint}</p>
      )}
    </section>
  );
}
