"use client";

import { useEffect, useMemo, useState } from "react";
import { GamePanel } from "../src/components/GamePanel";

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData?: string; ready?: () => void } };
  }
}

function readSessionId() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search);
  return q.get("sessionId") ?? "";
}

export default function HomePage() {
  const [sessionId, setSessionId] = useState("");
  const [initData, setInitData] = useState("");
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE ?? "", []);

  useEffect(() => {
    setSessionId(readSessionId());
    const tg = window.Telegram?.WebApp;
    tg?.ready?.();
    setInitData(tg?.initData ?? process.env.NEXT_PUBLIC_DEV_INIT_DATA ?? "");
  }, []);

  return (
    <main
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        padding: "1.5rem",
        background: "radial-gradient(ellipse at top, #123041 0%, #071018 55%)",
        color: "#e8d5a3",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ marginTop: 0, letterSpacing: "0.04em" }}>Quarto</h1>
      {!sessionId ? (
        <p>Open from a challenge card link with a sessionId.</p>
      ) : !initData ? (
        <p>Waiting for Telegram WebApp initData…</p>
      ) : (
        <GamePanel apiBase={apiBase || ""} sessionId={sessionId} initData={initData} />
      )}
    </main>
  );
}
