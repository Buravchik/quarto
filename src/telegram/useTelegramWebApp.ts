"use client";

import { useEffect, useState } from "react";
import { applyTelegramSafeAreaCssVars, watchTelegramSafeAreaCssVars } from "./applyTelegramSafeAreaCssVars";

export type TelegramBoot = {
  ready: boolean;
  initData: string;
  lang: string | undefined;
  /** True when WebApp API appeared but initData stayed empty (opened outside Telegram). */
  outsideTelegram: boolean;
};

/**
 * Wait for telegram-web-app.js + initData. A single mount read races `defer`/`async` script load
 * and leaves the Mini App stuck on "Waiting for initData…".
 */
export function useTelegramWebApp(timeoutMs = 4000): TelegramBoot {
  const [ready, setReady] = useState(false);
  const [initData, setInitData] = useState("");
  const [lang, setLang] = useState<string | undefined>(undefined);
  const [outsideTelegram, setOutsideTelegram] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let settled = false;
    let stopWatchInsets: (() => void) | undefined;

    const finish = (data: string, language?: string, outside = false) => {
      if (cancelled || settled) return;
      settled = true;
      setInitData(data);
      setLang(language);
      setOutsideTelegram(outside);
      setReady(true);
      applyTelegramSafeAreaCssVars();
      stopWatchInsets = watchTelegramSafeAreaCssVars();
    };

    const tryRead = (): boolean => {
      const tg = window.Telegram?.WebApp;
      if (!tg) return false;
      try {
        tg.ready?.();
        tg.expand?.();
      } catch {
        /* ignore */
      }
      applyTelegramSafeAreaCssVars();
      const data = (tg.initData ?? "").trim();
      if (data) {
        finish(data, tg.initDataUnsafe?.user?.language_code);
        return true;
      }
      return false;
    };

    if (tryRead()) {
      return () => {
        cancelled = true;
        stopWatchInsets?.();
      };
    }

    const started = Date.now();
    const tick = window.setInterval(() => {
      if (tryRead()) {
        window.clearInterval(tick);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        window.clearInterval(tick);
        const tg = window.Telegram?.WebApp;
        // Script may have loaded with empty initData (browser tab / non-Telegram WebView)
        finish("", tg?.initDataUnsafe?.user?.language_code, true);
      }
    }, 50);

    return () => {
      cancelled = true;
      window.clearInterval(tick);
      stopWatchInsets?.();
    };
  }, [timeoutMs]);

  return { ready, initData, lang, outsideTelegram };
}
