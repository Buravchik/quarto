"use client";

import { useEffect, useMemo, useState } from "react";
import { AchievementsPanel } from "../src/components/AchievementsPanel";
import { GamePanel } from "../src/components/GamePanel";
import { HomeLobby } from "../src/components/HomeLobby";
import { t } from "../src/i18n";
import { applySchemeToDocument, resolveScheme } from "../src/theme/scheme";
import { readStartParam, resolveLaunchSessionId } from "../src/telegram/launch";
import { useTelegramWebApp } from "../src/telegram/useTelegramWebApp";

const CONSUMED_START_KEY = "quarto:consumedStartParam";
const LAST_SESSION_KEY = "quarto:lastSession";

function storageGet(store: "local" | "session", key: string): string | null {
  try {
    return (store === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function storageSet(store: "local" | "session", key: string, value: string | null) {
  try {
    const s = store === "local" ? window.localStorage : window.sessionStorage;
    if (value == null) s.removeItem(key);
    else s.setItem(key, value);
  } catch {
    /* private mode */
  }
}

/** 021: fresh invite start_param wins over a stale ?sessionId (see src/telegram/launch.ts). */
function readSessionId() {
  if (typeof window === "undefined") return "";
  const decision = resolveLaunchSessionId({
    startParam: readStartParam(window),
    querySessionId: new URLSearchParams(window.location.search).get("sessionId"),
    consumedStartParam: storageGet("session", CONSUMED_START_KEY),
  });
  if (decision.consume) storageSet("session", CONSUMED_START_KEY, decision.consume);
  if (decision.sessionId) setSessionInUrl(decision.sessionId);
  return decision.sessionId;
}

function setSessionInUrl(sessionId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("sessionId", sessionId);
  window.history.replaceState({}, "", url.toString());
}

export default function HomePage() {
  const [sessionId, setSessionId] = useState("");
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const { ready, initData, lang, outsideTelegram } = useTelegramWebApp();
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE ?? "", []);
  const copy = t(lang);

  useEffect(() => {
    if (!ready) return;
    setLastSessionId(storageGet("local", LAST_SESSION_KEY));
    setSessionId((prev) => prev || readSessionId());
  }, [ready]);

  useEffect(() => {
    const scheme = resolveScheme();
    applySchemeToDocument(scheme);
  }, [ready]);

  function enterSession(next: string) {
    setSessionId(next);
    setSessionInUrl(next);
  }

  return (
    <main className="ex-app" data-expressive="true">
      <h1 className="ex-brand">{copy.appName}</h1>

      {!ready ? (
        <p className="ex-muted">{copy.waitingInitData}</p>
      ) : !initData ? (
        <section style={{ maxWidth: "28rem", display: "grid", gap: "0.75rem" }}>
          <p className="ex-headline" style={{ fontWeight: 500 }}>
            {outsideTelegram ? copy.openInsideTelegram : copy.waitingInitData}
          </p>
          <p className="ex-muted" style={{ margin: 0 }}>
            {copy.openViaBotHint}
          </p>
          <a href="https://t.me/tgquarto_bot" style={{ color: "var(--ex-primary)", fontWeight: 700 }}>
            @tgquarto_bot
          </a>
        </section>
      ) : !sessionId ? (
        <>
          <HomeLobby
            apiBase={apiBase}
            initData={initData}
            lang={lang}
            copy={{
              appName: copy.appName,
              homeTagline: copy.homeTagline,
              playWithFriend: copy.playWithFriend,
              playVsComputer: copy.playVsComputer,
              difficulty: copy.difficulty,
              difficultyEasy: copy.difficultyEasy,
              difficultyNormal: copy.difficultyNormal,
              difficultyHard: copy.difficultyHard,
              difficultyExpert: copy.difficultyExpert,
              homeHint: copy.homeHint,
              homeHintComputer: copy.homeHintComputer,
              creating: copy.creating,
              cardSent: copy.cardSent,
              sessionRules: copy.sessionRules,
              missVoid: copy.missVoid,
              pieRule: copy.pieRule,
              declareHints: copy.declareHints,
              settingsLocked: copy.settingsLocked,
            }}
            onStarted={enterSession}
          />
          <AchievementsPanel apiBase={apiBase} initData={initData} lang={lang} />
        </>
      ) : (
        <GamePanel
          apiBase={apiBase}
          key={sessionId}
          sessionId={sessionId}
          initData={initData}
          previousSessionId={lastSessionId && lastSessionId !== sessionId ? lastSessionId : undefined}
          onSwitchSession={enterSession}
          onSeatedChange={(id, live) => {
            // Remember the player's own live game so an invite screen can offer «Back to my game».
            if (live) {
              storageSet("local", LAST_SESSION_KEY, id);
            } else if (storageGet("local", LAST_SESSION_KEY) === id) {
              storageSet("local", LAST_SESSION_KEY, null);
              setLastSessionId(null);
            }
          }}
          onLeave={() => {
            setSessionId("");
            const url = new URL(window.location.href);
            url.searchParams.delete("sessionId");
            window.history.replaceState({}, "", url.toString());
          }}
        />

      )}
    </main>
  );
}
