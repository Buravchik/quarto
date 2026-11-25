"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { t } from "../i18n";
import { decodeChannels } from "../pieces/decode";
import { PieceToken } from "../pieces/PieceToken";
import { derivePlaySurfaceState } from "../play/derivePlaySurfaceState";
import { legalDeclareHintSets } from "../quarto/miss";
import { sharedTraitLabelKeys } from "../quarto/sharedTraits";
import { formatTimeoutCountdown, timeoutReady } from "../quarto/timeout";
import { ExPrimaryButton, ExSecondaryButton, ExSurface } from "../theme/components";
import { IconHelp, IconReplay, IconShare } from "../theme/icons";
import { Board } from "./Board";
import { Pool } from "./Pool";
import { RulesPanel } from "./RulesPanel";

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
  outcome: { type: string; winnerSeat?: number; declaredSet?: number[] } | null;
  seat0: { telegramUserId: string } | null;
  seat1: { telegramUserId: string } | null;
  modules?: string[];
  voidedSets?: number[][];
  pendingVoidSets?: number[][];
  lastPlacedCell?: number | null;
  lastPlacerSeat?: 0 | 1 | null;
  /** 021: display names per seat + group title for the invite screen. */
  seatNames?: [string | null, string | null];
  chatTitle?: string | null;
};

type Props = {
  apiBase: string;
  sessionId: string;
  initData: string;
  onLeave?: () => void;
  /** 021: the viewer's own live game (if any) — offered on the invite screen. */
  previousSessionId?: string;
  onSwitchSession?: (sessionId: string) => void;
  /** 021: viewer is seated in a live (not finished) game → page remembers it. */
  onSeatedChange?: (sessionId: string, live: boolean) => void;
};

type PreparedShare = { id: string | null; link: string | null; at: number };
/** savePreparedInlineMessage ids live for a while; refresh well before that. */
const PREPARED_TTL_MS = 10 * 60 * 1000;

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

export function GamePanel({
  apiBase,
  sessionId,
  initData,
  onLeave,
  previousSessionId,
  onSwitchSession,
  onSeatedChange,
}: Props) {
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
  const [declareUiOpen, setDeclareUiOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [prepared, setPrepared] = useState<PreparedShare | null>(null);

  const refresh = useCallback(async () => {
    const url = `${apiBase}/api/v1/sessions/${sessionId}?initData=${encodeURIComponent(initData)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error === "expired_init_data" ? copy.initDataExpired : `load ${res.status}`);
      return;
    }
    setSession((await res.json()) as Snapshot);
    setError(null);
  }, [apiBase, sessionId, initData, copy.initDataExpired]);

  /**
   * 021 share: server prepares the live card of THIS session (savePreparedInlineMessage);
   * fetched ahead of the tap so WebApp.shareMessage runs synchronously inside the gesture.
   */
  const prepareShare = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/sessions/${sessionId}/share`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { preparedMessageId?: string | null; link?: string | null };
      setPrepared({ id: data.preparedMessageId ?? null, link: data.link ?? null, at: Date.now() });
    } catch {
      /* fallback: switchInlineQuery */
    }
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

  useEffect(() => {
    if (!session) return;
    const canDeclare = derivePlaySurfaceState({
      status: session.status,
      phase: session.phase,
      turnSeat: session.turnSeat,
      pieceInHand: session.pieceInHand,
      seat0: session.seat0,
      seat1: session.seat1,
      outcome: session.outcome,
      pieRule: session.pieRule,
      viewerTelegramUserId: me,
    }).showDeclareControls;
    if (!canDeclare) {
      setDeclareUiOpen(false);
      setDeclareCells([]);
    }
  }, [session, me]);

  const viewerSeated =
    !!me && (session?.seat0?.telegramUserId === me || session?.seat1?.telegramUserId === me);
  const sessionLive = !!session && session.status !== "finished" && !session.outcome;
  useEffect(() => {
    if (!session || !viewerSeated) return;
    onSeatedChange?.(sessionId, sessionLive);
  }, [session, viewerSeated, sessionLive, sessionId, onSeatedChange]);

  const ownerWaiting =
    !!session && session.status === "waiting" && session.seat0?.telegramUserId === me && !session.seat1;
  useEffect(() => {
    if (!ownerWaiting || session?.opponentKind === "computer") return;
    if (prepared && Date.now() - prepared.at < PREPARED_TTL_MS) return;
    void prepareShare();
  }, [ownerWaiting, session?.opponentKind, prepared, prepareShare]);

  function shareInvite() {
    const tg = window.Telegram?.WebApp;
    const fresh = prepared && Date.now() - prepared.at < PREPARED_TTL_MS ? prepared : null;
    if (fresh?.id && typeof tg?.shareMessage === "function") {
      try {
        tg.shareMessage(fresh.id, () => {
          setPrepared(null); // one prepared message per share
          void refresh();
        });
        return;
      } catch {
        /* old client → fallback */
      }
    }
    // Fallback: inline mode with THIS session id as the query → bot answers with this card.
    if (tg && typeof tg.switchInlineQuery === "function") {
      tg.switchInlineQuery(sessionId, ["users", "groups"]);
      return;
    }
    const link = fresh?.link;
    if (link && tg && typeof tg.openTelegramLink === "function") {
      tg.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(copy.shareInviteTitle)}`,
      );
      return;
    }
    setError(copy.cardSent);
  }

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
      setDeclareUiOpen(false);
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
  const computerSeat: 0 | 1 | null =
    session.seat0?.telegramUserId === "computer"
      ? 0
      : session.seat1?.telegramUserId === "computer"
        ? 1
        : null;
  const declaredSet =
    session.outcome?.type === "win" && Array.isArray(session.outcome.declaredSet)
      ? session.outcome.declaredSet
      : null;
  const winCells = declaredSet ?? [];
  const lastMoveCell =
    vsComputer &&
    computerSeat != null &&
    session.status !== "finished" &&
    session.lastPlacerSeat === computerSeat &&
    session.lastPlacedCell != null
      ? session.lastPlacedCell
      : null;
  const sharedTraitKeys = declaredSet
    ? sharedTraitLabelKeys(session.board, declaredSet, session.modules)
    : [];
  const sharedTraitText = sharedTraitKeys
    .map((k) => (copy as Record<string, string>)[k] ?? k)
    .filter(Boolean)
    .join(", ");
  const winnerLine = (() => {
    if (!session.outcome || session.outcome.type !== "win" || session.outcome.winnerSeat == null) {
      return null;
    }
    const w = session.outcome.winnerSeat;
    if (surface.viewerSeat != null && w === surface.viewerSeat) return copy.youWon;
    if (computerSeat != null && w === computerSeat) return copy.computerWon;
    return copy.opponentWon;
  })();
  const headlines: Record<string, string> = {
    promptGive: copy.promptGive,
    promptPlace: copy.promptPlace,
    promptWait: vsComputer ? copy.waitingComputer : copy.promptWait,
    promptPieChoice: copy.promptPieChoice,
    promptFinished: winnerLine ?? copy.promptFinished,
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
  // Join (invite) and other waiting views: header keeps ? + «New match»; Join lives in the invite card.
  const showLeaveOnly = showWaitingChrome && !showWaitActions && !!onLeave;
  const waitingOneRow = showWaitActions || showJoinActions || showLeaveOnly;
  const inviterName = session.seatNames?.[0] ?? null;

  const declaring = surface.showDeclareControls && declareUiOpen;
  const hintSets =
    declaring && session.declareHints
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
    const link =
      prepared?.link ?? `${window.location.origin}${window.location.pathname}?sessionId=${sessionId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(link);
    }
  }

  return (
    <section className="ex-game">
      {vsComputer ? (
        <p className="ex-muted" style={{ margin: 0, fontSize: "0.9rem" }}>
          {copy.opponentComputer}
          {difficultyLabel ? ` · ${difficultyLabel}` : ""}
        </p>
      ) : null}
      {showJoinActions ? (
        <ExSurface emphasized className="ex-invite">
          <p className="ex-headline ex-invite__title">
            {inviterName
              ? copy.inviteHeadline.replace("{name}", inviterName)
              : copy.inviteHeadlineAnon}
          </p>
          {session.chatTitle ? (
            <p className="ex-muted ex-invite__chat">
              {copy.inviteFromChat.replace("{title}", `«${session.chatTitle}»`)}
            </p>
          ) : null}
          <ExPrimaryButton className="ex-invite__join" disabled={busy} onClick={() => void join()}>
            {copy.inviteJoin}
          </ExPrimaryButton>
          {previousSessionId && onSwitchSession ? (
            <>
              <p className="ex-muted ex-invite__note">{copy.inviteOtherGame}</p>
              <ExSecondaryButton
                disabled={busy}
                onClick={() => onSwitchSession(previousSessionId)}
              >
                {copy.inviteBackToMine}
              </ExSecondaryButton>
            </>
          ) : null}
        </ExSurface>
      ) : null}
      <ExSurface emphasized>
        <div className={waitingOneRow ? "ex-waiting-row" : "ex-play-header"}>
          <p className={`ex-headline${waitingOneRow ? " ex-waiting-headline" : ""}`}>
            {headline}
          </p>
          <div className="ex-waiting-actions">
            <ExSecondaryButton
              className={`ex-icon-btn ex-icon-btn--ghost${rulesOpen ? " ex-icon-btn--active" : ""}`}
              aria-label={copy.rulesButton}
              title={copy.rulesButton}
              aria-expanded={rulesOpen}
              aria-controls="quarto-rules-panel"
              onClick={() => setRulesOpen((v) => !v)}
            >
              <IconHelp />
            </ExSecondaryButton>
            {showWaitActions ? (
              <>
                <ExPrimaryButton
                  className="ex-icon-btn"
                  disabled={busy}
                  aria-label={copy.shareSession}
                  title={copy.shareSession}
                  onClick={shareInvite}
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
              </>
            ) : null}
            {showLeaveOnly ? (
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
        </div>
        {rulesOpen ? (
          <div id="quarto-rules-panel">
            <RulesPanel
              missMode={session.missMode}
              pieRule={session.pieRule}
              declareHints={session.declareHints ?? false}
              copy={{
                rulesTitle: copy.rulesTitle,
                rulesClassic: copy.rulesClassic,
                rulesTraits: copy.rulesTraits,
                rulesDeclare: copy.rulesDeclare,
                sessionRules: copy.sessionRules,
                missVoid: copy.missVoid,
                missPersistent: copy.missPersistent,
                pieRule: copy.pieRule,
                declareHints: copy.declareHints,
                rulesOn: copy.rulesOn,
                rulesOff: copy.rulesOff,
              }}
            />
          </div>
        ) : null}
        {session.outcome && session.outcome.type !== "win" ? (
          <p className="ex-muted" style={{ margin: "0.35rem 0 0" }}>
            {copy.matchEnded}: {session.outcome.type}
          </p>
        ) : null}
        {lastMoveCell != null ? (
          <p className="ex-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>
            {copy.computerLastMove}
          </p>
        ) : null}
      </ExSurface>
      {declaredSet && winnerLine ? (
        <div className="ex-win-banner" role="status">
          <p className="ex-headline">{winnerLine}</p>
          {sharedTraitText ? (
            <p className="ex-muted" style={{ margin: 0 }}>
              {copy.winByTraits.replace("{traits}", sharedTraitText)}
            </p>
          ) : null}
        </div>
      ) : null}
      {showWaitActions ? (
        <button
          type="button"
          className="ex-debug-link"
          disabled={busy}
          onClick={() => void copyDebugLink()}
        >
          {copied ? copy.linkCopied : prepared?.link ? copy.copyInviteLink : copy.shareDebugLink}
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

      {surface.showDeclareControls && !declareUiOpen ? (
        <ExPrimaryButton disabled={busy} onClick={() => setDeclareUiOpen(true)}>
          {copy.declareOpen}
        </ExPrimaryButton>
      ) : null}
      {declaring ? (
        <div className="ex-declare-banner" role="status">
          <p className="ex-headline">{copy.declareSelectLine}</p>
          <p className="ex-muted" style={{ margin: 0 }}>
            {copy.declareSelectedCount.replace("{n}", String(declareCells.length))}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <ExPrimaryButton
              disabled={busy || declareCells.length !== 4}
              onClick={() => void sendIntent({ type: "declare", setCells: declareCells })}
            >
              {copy.declareConfirm}
            </ExPrimaryButton>
            <ExSecondaryButton
              disabled={busy}
              onClick={() => {
                setDeclareUiOpen(false);
                setDeclareCells([]);
              }}
            >
              {copy.declareCancel}
            </ExSecondaryButton>
          </div>
        </div>
      ) : null}

      <Board
        board={session.board}
        moduleId={moduleId}
        declareCells={declareCells}
        hintCells={hintCells}
        lastMoveCell={lastMoveCell}
        winCells={winCells}
        selectableOccupied={declaring}
        selectableEmpty={surface.showPlaceControls}
        disabled={busy || (!surface.showPlaceControls && !declaring)}
        pieceLabel={labelFor}
        onCell={(i) => {
          if (surface.showPlaceControls && !session.board[i]) {
            void sendIntent({ type: "place", cellIndex: i });
            return;
          }
          // Declare: only occupied cells (Quarto lines never include empties)
          if (declaring && session.board[i]) {
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
