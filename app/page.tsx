"use client";

import { useEffect, useMemo, useState } from "react";
import { AchievementsPanel } from "../src/components/AchievementsPanel";
import { GamePanel } from "../src/components/GamePanel";
import { HomeLobby } from "../src/components/HomeLobby";
import { t } from "../src/i18n";
import { applySchemeToDocument, resolveScheme } from "../src/theme/scheme";
import { useTelegramWebApp } from "../src/telegram/useTelegramWebApp";

function readSessionId() {
  if (typeof window === "undefined") return "";
  const fromQuery = new URLSearchParams(window.location.search).get("sessionId");
  if (fromQuery) return fromQuery;
  // Opened via t.me/.../?startapp=<sessionId> (inline / group deep link)
  const fromStart = window.Telegram?.WebApp?.initDataUnsafe?.start_param?.trim();
  return fromStart ?? "";
}

function setSessionInUrl(sessionId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("sessionId", sessionId);
  window.history.replaceState({}, "", url.toString());
}

export default function HomePage() {
  const [sessionId, setSessionId] = useState("");
  const { ready, initData, lang, outsideTelegram } = useTelegramWebApp();
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE ?? "", []);
  const copy = t(lang);

  useEffect(() => {
    if (!ready) return;
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
          sessionId={sessionId}
          initData={initData}
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
