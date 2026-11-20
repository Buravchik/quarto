"use client";

import { useCallback, useEffect, useState } from "react";
import { ACHIEVEMENT_IDS, type AchievementId } from "../quarto/achievements";

const LABELS: Record<AchievementId, { en: string; ru: string }> = {
  first_match: { en: "First match", ru: "Первая партия" },
  first_quarto: { en: "First Quarto", ru: "Первое Кварто" },
  drawn_board: { en: "Drawn board", ru: "Ничья" },
  rematch: { en: "Rematch", ru: "Реванш" },
  host: { en: "Host", ru: "Хост" },
  comeback_seat: { en: "Pie win", ru: "Победа с Pie" },
};

type Props = {
  apiBase: string;
  initData: string;
  lang?: string;
};

export function AchievementsPanel({ apiBase, initData, lang }: Props) {
  const ru = (lang ?? "").toLowerCase().startsWith("ru");
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `${apiBase}/api/v1/me/achievements?initData=${encodeURIComponent(initData)}`,
      );
      if (!res.ok) {
        setError(`achievements ${res.status}`);
        return;
      }
      const data = (await res.json()) as { unlocked: string[]; pinned: string[] };
      setUnlocked(data.unlocked ?? []);
      setPinned(data.pinned ?? []);
      setError(null);
    } catch {
      setError("achievements_network");
    }
  }, [apiBase, initData]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function togglePin(id: string) {
    const next = pinned.includes(id)
      ? pinned.filter((x) => x !== id)
      : pinned.length < 2
        ? [...pinned, id]
        : pinned;
    setBusy(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/me/achievements/pin`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData, pinned: next }),
      });
      const data = (await res.json()) as {
        unlocked?: string[];
        pinned?: string[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? `pin ${res.status}`);
        return;
      }
      setUnlocked(data.unlocked ?? unlocked);
      setPinned(data.pinned ?? next);
      setError(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ex-surface" style={{ marginTop: "1.25rem" }}>
      <h2 className="ex-headline" style={{ fontSize: "1.05rem", margin: "0 0 0.5rem" }}>
        {ru ? "Достижения" : "Achievements"}
      </h2>
      <p className="ex-muted" style={{ margin: "0 0 0.6rem", fontSize: "0.9rem" }}>
        {ru ? "Закрепите до двух — покажутся на карточке." : "Pin up to two — shown on the challenge card."}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.35rem" }}>
        {ACHIEVEMENT_IDS.map((id) => {
          const have = unlocked.includes(id);
          const isPinned = pinned.includes(id);
          const label = LABELS[id][ru ? "ru" : "en"];
          return (
            <li
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                opacity: have ? 1 : 0.45,
                borderBottom: "1px solid var(--ex-outline)",
                padding: "0.35rem 0",
              }}
            >
              <span>
                {isPinned ? "★ " : "☆ "}
                {label}
              </span>
              <button
                type="button"
                className={isPinned ? "ex-btn ex-btn--primary" : "ex-btn ex-btn--secondary"}
                disabled={busy || !have}
                onClick={() => void togglePin(id)}
                style={{ fontSize: "0.85rem", padding: "0.3rem 0.65rem" }}
              >
                {isPinned ? (ru ? "Открепить" : "Unpin") : ru ? "Закрепить" : "Pin"}
              </button>
            </li>
          );
        })}
      </ul>
      {error ? <p className="ex-error" style={{ margin: "0.5rem 0 0" }}>{error}</p> : null}
    </section>
  );
}
