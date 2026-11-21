"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { t } from "../i18n";
import { decodeChannels } from "../pieces/decode";
import { PieceToken } from "../pieces/PieceToken";
import { derivePlaySurfaceState } from "../play/derivePlaySurfaceState";
import { legalDeclareHintSets } from "../quarto/miss";
import { formatTimeoutCountdown, timeoutReady } from "../quarto/timeout";
import { ExPrimaryButton, ExSecondaryButton, ExSurface } from "../theme/components";
import { IconPersonAdd, IconReplay, IconShare } from "../theme/icons";
import { Board } from "./Board";
import { Pool } from "./Pool";

type Snapshot = {
  sessionId: string;
  status: string;
  phase: string;
  missMode: "persistent" | "void";
  pieRule: boolean;
  declareHints?: boolean;
  difficulty?: "easy" | "normal" | "hard" | "expert" | null;
  opponentKind?: "human" | "computer";
  settingsLocked: boolean;
  board: (string | null)[];
  pool: string[];
  pieceInHand: string | null;
  turnSeat: 0 | 1 | null;
  turnNotifiedAt: string | null;
  outcome: { type: string; winnerSeat?: number } | null;
  seat0: { telegramUserId: string } | null;
  seat1: { telegramUserId: string } | null;
  modules?: string[];
  voidedSets?: number[][];
  pendingVoidSets?: number[][];
  lastPlacedCell?: number | null;
};

type Props = {
  apiBase: string;
  sessionId: string;
  initData: string;
  onLeave?: () => void;
};

function readTelegramUserId(): string {
  if (typeof window === "undefined") return "";
  const id = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  return id != null ? String(id) : "";
}

function traitLabel(
  copy: ReturnType<typeof t>,
  pieceId: string,
  moduleId: string,
): string {
  const ch = decodeChannels(moduleId, pieceId);
  if (!ch) return pieceId;
  const parts = [
    ch.tone === "light" ? copy.traitToneLight : copy.traitToneDark,
    ch.stature === "tall" ? copy.traitStatureTall : copy.traitStatureShort,
    ch.plan === "round" ? copy.traitPlanRound : copy.traitPlanSquare,
    ch.aperture === "hollow" ? copy.traitApertureHollow : copy.traitApertureSolid,
  ];
  return parts.join(", ");
}

export function GamePanel({ apiBase, sessionId, initData, onLeave }: Props) {
  const copy = useMemo(
    () =>
      t(
        typeof window !== "undefined"
          ? window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code
          : undefined,
      ),
    [],
  );
  const me = useMemo(() => readTelegramUserId(), []);
  const [session, setSession] = useState<Snapshot | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [declareCells, setDeclareCells] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

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
    const id = window.setInterval(() => void refresh(), 2500);
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

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

  async function rematch(action: "offer" | "accept" | "decline") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/sessions/${sessionId}/rematch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData, action }),
      });
      const data = (await res.json()) as {
        error?: string;
        newSessionId?: string;
        offerState?: string;
      };
      if (!res.ok) {
        setError(data.error ?? `rematch ${res.status}`);
        return;
      }
      if (data.newSessionId && typeof window !== "undefined") {
        const u = new URL(window.location.href);
        u.searchParams.set("sessionId", data.newSessionId);
        window.location.href = u.toString();
        return;
      }
    } finally {
      setBusy(false);
    }
  }

  function toggleDeclare(i: number) {
    if (!session?.board[i]) return;
    setDeclareCells((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : prev.length < 4 ? [...prev, i] : prev,
    );
  }

  function sameSet(a: number[], b: number[]) {
    if (a.length !== b.length) return false;
    const sa = [...a].sort((x, y) => x - y);
    const sb = [...b].sort((x, y) => x - y);
    return sa.every((v, idx) => v === sb[idx]);
  }

  function selectDeclareFromHints(i: number, hintSets: number[][]) {
    const matching = hintSets.filter((set) => set.includes(i));
    if (matching.length === 0) {
      toggleDeclare(i);
      return;
    }
    setDeclareCells((prev) => {
      const curIdx = matching.findIndex((set) => sameSet(set, prev));
      if (curIdx >= 0) {
        return matching[(curIdx + 1) % matching.length]!;
      }
      return matching[0]!;
    });
  }

  if (!session) {
    return (
      <section>
        <p className="ex-muted">{error ?? copy.waitingInitData}</p>
      </section>
    );
  }

  const moduleId = session.modules?.[0] || "classic4";
  const surface = derivePlaySurfaceState({
    status: session.status,
    phase: session.phase,
    turnSeat: session.turnSeat,
    pieceInHand: session.pieceInHand,
    seat0: session.seat0,
    seat1: session.seat1,
    outcome: session.outcome,
    pieRule: session.pieRule,
    viewerTelegramUserId: me,
  });

  const vsComputer = session.opponentKind === "computer";
  const headlines: Record<string, string> = {
    promptGive: copy.promptGive,
    promptPlace: copy.promptPlace,
    promptWait: vsComputer ? copy.waitingComputer : copy.promptWait,
    promptPieChoice: copy.promptPieChoice,
    promptFinished: copy.promptFinished,
    promptJoin: copy.promptJoin,
    waitingOpponent: copy.waitingOpponent,
  };
  const headline = headlines[surface.headlineKey] ?? surface.headlineKey;
  const labelFor = (id: string) => traitLabel(copy, id, moduleId);
  const difficultyLabel =
    session.difficulty === "easy"
      ? copy.difficultyEasy
      : session.difficulty === "hard"
        ? copy.difficultyHard
        : session.difficulty === "expert"
          ? copy.difficultyExpert
          : session.difficulty === "normal"
            ? copy.difficultyNormal
            : null;

  const showWaitingChrome = session.status === "waiting";
  const showWaitActions =
    showWaitingChrome && surface.expectedAction === "wait" && surface.viewerSeat === 0;
  const showJoinActions = showWaitingChrome && surface.expectedAction === "join";
  const showLeaveOnly =
    showWaitingChrome &&
    surface.expectedAction !== "wait" &&
    surface.expectedAction !== "join" &&
    !!onLeave;
  const waitingOneRow = showWaitActions || showJoinActions || showLeaveOnly;

  const hintSets =
    surface.showDeclareControls && session.declareHints
      ? legalDeclareHintSets({
          declareHints: true,
          missMode: session.missMode,
          board: session.board,
          lastPlacedCell: session.lastPlacedCell ?? null,
          voidedSets: session.voidedSets ?? [],
          pendingVoidSets: session.pendingVoidSets ?? [],
          modules: session.modules,
        })
      : [];
  const hintCells = hintSets.flat();

  async function copyDebugLink() {
    const link = `${window.location.origin}${window.location.pathname}?sessionId=${sessionId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(link);
    }
  }

  return (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      {vsComputer ? (
        <p className="ex-muted" style={{ margin: 0, fontSize: "0.9rem" }}>
          {copy.opponentComputer}
          {difficultyLabel ? ` · ${difficultyLabel}` : ""}
        </p>
      ) : null}
      <ExSurface emphasized>
        <div className={waitingOneRow ? "ex-waiting-row" : undefined}>
          <p className={`ex-headline${waitingOneRow ? " ex-waiting-headline" : ""}`}>
            {headline}
          </p>
          {showWaitActions ? (
            <div className="ex-waiting-actions">
              <ExPrimaryButton
                className="ex-icon-btn"
                disabled={busy}
                aria-label={copy.shareSession}
                title={copy.shareSession}
                onClick={() => {
                  const tg = window.Telegram?.WebApp;
                  if (tg && typeof tg.switchInlineQuery === "function") {
                    tg.switchInlineQuery("");
                    return;
                  }
                  setError(copy.cardSent);
                }}
              >
                <IconShare />
              </ExPrimaryButton>
              {onLeave ? (
                <ExSecondaryButton
                  className="ex-icon-btn"
                  disabled={busy}
                  aria-label={copy.backHome}
                  title={copy.backHome}
                  onClick={onLeave}
                >
                  <IconReplay />
                </ExSecondaryButton>
              ) : null}
            </div>
          ) : null}
          {showJoinActions ? (
            <div className="ex-waiting-actions">
              <ExPrimaryButton
                className="ex-icon-btn"
                disabled={busy}
                aria-label={copy.joinSeat1}
                title={copy.joinSeat1}
                onClick={() => void join()}
              >
                <IconPersonAdd />
              </ExPrimaryButton>
              {onLeave ? (
                <ExSecondaryButton
                  className="ex-icon-btn"
                  disabled={busy}
                  aria-label={copy.backHome}
                  title={copy.backHome}
                  onClick={onLeave}
                >
                  <IconReplay />
                </ExSecondaryButton>
              ) : null}
            </div>
          ) : null}
          {showLeaveOnly ? (
            <div className="ex-waiting-actions">
              <ExSecondaryButton
                className="ex-icon-btn"
                disabled={busy}
                aria-label={copy.backHome}
                title={copy.backHome}
                onClick={onLeave}
              >
                <IconReplay />
              </ExSecondaryButton>
            </div>
          ) : null}
        </div>
        {session.outcome ? (
          <p className="ex-muted" style={{ margin: "0.35rem 0 0" }}>
            {copy.matchEnded}: {session.outcome.type}
          </p>
        ) : null}
      </ExSurface>
      {showWaitActions ? (
        <button
          type="button"
          className="ex-debug-link"
          disabled={busy}
          onClick={() => void copyDebugLink()}
        >
          {copied ? copy.linkCopied : copy.shareDebugLink}
        </button>
      ) : null}
      {error ? <p className="ex-error">{error}</p> : null}

      {surface.showPieControls ? (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <ExPrimaryButton
            disabled={busy}
            onClick={() => void sendIntent({ type: "pie_choice", pieTake: true })}
          >
            {copy.pieTake}
          </ExPrimaryButton>
          <ExSecondaryButton
            disabled={busy}
            onClick={() => void sendIntent({ type: "pie_choice", pieTake: false })}
          >
            {copy.piePass}
          </ExSecondaryButton>
        </div>
      ) : null}

      {session.pieceInHand ? (
        <div className="ex-hand">
          <span className="ex-muted">{copy.handLabel}</span>
          <PieceToken
            pieceId={session.pieceInHand}
            moduleId={moduleId}
            size="lg"
            emphasis={surface.handEmphasis ? "inHand" : "none"}
            label={labelFor(session.pieceInHand)}
          />
        </div>
      ) : null}

      {surface.showDeclareControls ? (
        <div className="ex-declare-banner" role="status">
          <p className="ex-headline">{copy.declareSelectLine}</p>
          <p className="ex-muted" style={{ margin: 0 }}>
            {copy.declareSelectedCount.replace("{n}", String(declareCells.length))}
          </p>
          <ExPrimaryButton
            disabled={busy || declareCells.length !== 4}
            onClick={() => void sendIntent({ type: "declare", setCells: declareCells })}
          >
            {copy.declareQuarto}
          </ExPrimaryButton>
        </div>
      ) : null}

      <Board
        board={session.board}
        moduleId={moduleId}
        declareCells={declareCells}
        hintCells={hintCells}
        selectableOccupied={surface.showDeclareControls}
        selectableEmpty={surface.showPlaceControls}
        disabled={busy || (!surface.showPlaceControls && !surface.showDeclareControls)}
        pieceLabel={labelFor}
        onCell={(i) => {
          if (surface.showPlaceControls && !session.board[i]) {
            void sendIntent({ type: "place", cellIndex: i });
            return;
          }
          // Declare: only occupied cells (Quarto lines never include empties)
          if (surface.showDeclareControls && session.board[i]) {
            if (hintSets.length > 0) {
              selectDeclareFromHints(i, hintSets);
            } else {
              toggleDeclare(i);
            }
          }
        }}
      />

      <div>
        <h2 className="ex-headline" style={{ fontSize: "1rem", margin: "0 0 0.4rem" }}>
          {copy.pool}
        </h2>
        <Pool
          pool={session.pool}
          moduleId={moduleId}
          selected={selectedPiece}
          disabled={busy || !surface.showGiveControls}
          onSelect={setSelectedPiece}
          pieceLabel={labelFor}
        />
        {surface.showGiveControls ? (
          <ExPrimaryButton
            disabled={busy || !selectedPiece}
            style={{ marginTop: "0.65rem" }}
            onClick={() => selectedPiece && void sendIntent({ type: "give", pieceId: selectedPiece })}
          >
            {copy.giveSelected}
          </ExPrimaryButton>
        ) : null}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
        <ExSecondaryButton
          disabled={busy || session.status === "waiting" || session.status === "finished"}
          onClick={() => void sendIntent({ type: "resign" })}
        >
          {copy.resign}
        </ExSecondaryButton>
        {(() => {
          const stallingIsComputer =
            session.turnSeat === 0
              ? session.seat0?.telegramUserId === "computer"
              : session.turnSeat === 1
                ? session.seat1?.telegramUserId === "computer"
                : false;
          const waitingSeat =
            surface.viewerSeat != null &&
            session.turnSeat != null &&
            surface.viewerSeat !== session.turnSeat &&
            session.status !== "waiting" &&
            session.status !== "finished" &&
            !stallingIsComputer;
          if (!waitingSeat) return null;
          const gate = timeoutReady(session.turnNotifiedAt, new Date(nowMs));
          if (gate.ready) {
            return (
              <ExSecondaryButton
                disabled={busy}
                onClick={() => void sendIntent({ type: "claim_timeout" })}
              >
                {copy.claimTimeout}
              </ExSecondaryButton>
            );
          }
          return (
            <p className="ex-muted" style={{ margin: 0, fontSize: "0.95rem" }}>
              {copy.timeoutCountdown.replace(
                "{time}",
                formatTimeoutCountdown(gate.retryAfterSeconds),
              )}
            </p>
          );
        })()}
      </div>

      {session.status === "finished" ? (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <ExPrimaryButton disabled={busy} onClick={() => void rematch("offer")}>
            {vsComputer ? copy.rematchComputer : copy.offerRematch}
          </ExPrimaryButton>
          {!vsComputer ? (
            <>
              <ExSecondaryButton disabled={busy} onClick={() => void rematch("accept")}>
                {copy.acceptRematch}
              </ExSecondaryButton>
              <ExSecondaryButton disabled={busy} onClick={() => void rematch("decline")}>
                {copy.declineRematch}
              </ExSecondaryButton>
            </>
          ) : null}
          {onLeave ? (
            <ExSecondaryButton disabled={busy} onClick={onLeave}>
              {copy.backHome}
            </ExSecondaryButton>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
