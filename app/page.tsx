"use client";

import { useEffect, useMemo, useState } from "react";
import { AchievementsPanel } from "../src/components/AchievementsPanel";
import { GamePanel } from "../src/components/GamePanel";
import { HomeLobby } from "../src/components/HomeLobby";
import { t } from "../src/i18n";
import { useTelegramWebApp } from "../src/telegram/useTelegramWebApp";

function readSessionId() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("sessionId") ?? "";
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
    setSessionId(readSessionId());
  }, []);

  function enterSession(next: string) {
    setSessionId(next);
    setSessionInUrl(next);
  }

  return (
    <main
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        padding: "1.5rem",
        background:
          "radial-gradient(ellipse at 20% 0%, #1a4a4e 0%, #123041 35%, #071018 70%)",
        color: "#e8d5a3",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          margin: "0 0 0.75rem",
          letterSpacing: "0.04em",
          fontSize: "2.4rem",
          fontWeight: 700,
        }}
      >
        {copy.appName}
      </h1>

      {!ready ? (
        <p style={{ opacity: 0.7 }}>{copy.waitingInitData}</p>
      ) : !initData ? (
        <section style={{ maxWidth: "28rem", display: "grid", gap: "0.75rem" }}>
          <p style={{ margin: 0, fontSize: "1.1rem", lineHeight: 1.45 }}>
            {outsideTelegram ? copy.openInsideTelegram : copy.waitingInitData}
          </p>
          <p style={{ margin: 0, opacity: 0.75 }}>{copy.openViaBotHint}</p>
          <a
            href="https://t.me/tgquarto_bot"
            style={{ color: "#c49a2a", fontWeight: 700 }}
          >
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
              startMatch: copy.startMatch,
              homeHint: copy.homeHint,
              creating: copy.creating,
            }}
            onStarted={enterSession}
          />
          <AchievementsPanel apiBase={apiBase} initData={initData} lang={lang} />
        </>
      ) : (
        <>
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
          <AchievementsPanel apiBase={apiBase} initData={initData} lang={lang} />
        </>
      )}
    </main>
  );
}
