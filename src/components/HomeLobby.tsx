"use client";

import { useState } from "react";
import { PieceToken } from "../pieces/PieceToken";
import { ExPrimaryButton, ExSecondaryButton, ExSurface } from "../theme/components";
import { Settings } from "./Settings";

type Difficulty = "easy" | "normal" | "hard" | "expert";

type Props = {
  apiBase: string;
  initData: string;
  lang: string | undefined;
  copy: {
    appName: string;
    homeTagline: string;
    startMatch: string;
    playVsComputer: string;
    difficulty: string;
    difficultyEasy: string;
    difficultyNormal: string;
    difficultyHard: string;
    difficultyExpert: string;
    homeHint: string;
    homeHintComputer: string;
    creating: string;
    cardSent: string;
    sessionRules: string;
    missVoid: string;
    pieRule: string;
    declareHints: string;
    settingsLocked: string;
  };
  onStarted: (sessionId: string) => void;
};

const PREVIEW_IDS = ["p0", "p5", "pa", "pf"] as const;

export function HomeLobby({ apiBase, initData, copy, onStarted }: Props) {
  const [missMode, setMissMode] = useState<"persistent" | "void">("persistent");
  const [pieRule, setPieRule] = useState(false);
  const [declareHints, setDeclareHints] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startMatch(vsComputer: boolean) {
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
          declareHints,
          ...(vsComputer ? { vsComputer: true, difficulty } : {}),
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
        declareHints={declareHints}
        locked={false}
        disabled={busy}
        labels={{
          sessionRules: copy.sessionRules,
          missVoid: copy.missVoid,
          pieRule: copy.pieRule,
          declareHints: copy.declareHints,
          settingsLocked: copy.settingsLocked,
        }}
        onChange={(next) => {
          setMissMode(next.missMode);
          setPieRule(next.pieRule);
          setDeclareHints(next.declareHints);
        }}
      />

      <label className="ex-rules__row" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <span className="ex-muted">{copy.difficulty}</span>
        <select
          value={difficulty}
          disabled={busy}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          aria-label={copy.difficulty}
        >
          <option value="easy">{copy.difficultyEasy}</option>
          <option value="normal">{copy.difficultyNormal}</option>
          <option value="hard">{copy.difficultyHard}</option>
          <option value="expert">{copy.difficultyExpert}</option>
        </select>
      </label>

      <ExPrimaryButton disabled={busy || !initData} onClick={() => void startMatch(true)}>
        {busy ? copy.creating : copy.playVsComputer}
      </ExPrimaryButton>

      <ExSecondaryButton disabled={busy || !initData} onClick={() => void startMatch(false)}>
        {copy.startMatch}
      </ExSecondaryButton>

      {error ? (
        <p className="ex-error">{error}</p>
      ) : (
        <p className="ex-muted" style={{ margin: 0, fontSize: "0.95rem" }}>
          {copy.homeHintComputer}
        </p>
      )}
    </section>
  );
}
