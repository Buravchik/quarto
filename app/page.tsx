"use client";

import { useEffect, useMemo, useState } from "react";
import { GamePanel } from "../src/components/GamePanel";
import { HomeLobby } from "../src/components/HomeLobby";
import { t } from "../src/i18n";

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
  const [initData, setInitData] = useState("");
  const [lang, setLang] = useState<string | undefined>(undefined);
  const [booted, setBooted] = useState(false);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE ?? "", []);
  const copy = t(lang);

  useEffect(() => {
    setSessionId(readSessionId());
    const tg = window.Telegram?.WebApp;
    tg?.ready?.();
    tg?.expand?.();
    setInitData(tg?.initData ?? process.env.NEXT_PUBLIC_DEV_INIT_DATA ?? "");
    setLang(tg?.initDataUnsafe?.user?.language_code);
    setBooted(true);
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

      {!booted ? (
        <p style={{ opacity: 0.7 }}>{copy.waitingInitData}</p>
      ) : !sessionId ? (
        !initData ? (
          <p style={{ opacity: 0.85 }}>{copy.waitingInitData}</p>
        ) : (
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
        )
      ) : !initData ? (
        <p style={{ opacity: 0.85 }}>{copy.waitingInitData}</p>
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
