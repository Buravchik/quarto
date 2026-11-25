"use client";

/**
 * 021 P0 native basics for the Telegram Mini App: BackButton, HapticFeedback, theme sync,
 * closing confirmation, lifecycle events. Every call is guarded — old clients / browser
 * tabs simply get no-ops.
 */
import { useEffect, useRef } from "react";
import type { ExScheme } from "../theme/scheme";

type WebApp = NonNullable<NonNullable<Window["Telegram"]>["WebApp"]>;

function webApp(): WebApp | undefined {
  return typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
}

function atLeast(tg: WebApp, version: string): boolean {
  try {
    return typeof tg.isVersionAtLeast === "function" ? tg.isVersionAtLeast(version) : true;
  } catch {
    return false;
  }
}

export type HapticKind = "select" | "light" | "medium" | "success" | "warning" | "error";

export function haptic(kind: HapticKind) {
  const tg = webApp();
  const h = tg?.HapticFeedback;
  if (!tg || !h || !atLeast(tg, "6.1")) return;
  try {
    if (kind === "select") h.selectionChanged();
    else if (kind === "light" || kind === "medium") h.impactOccurred(kind);
    else h.notificationOccurred(kind);
  } catch {
    /* ignore */
  }
}

/** Surface colours from expressive.css so Telegram's header/background match the app. */
export const CHROME_COLORS: Record<ExScheme, string> = {
  dark: "#0b1520",
  light: "#eef6f5",
};

export function syncTelegramChrome(scheme: ExScheme) {
  const tg = webApp();
  if (!tg) return;
  const color = CHROME_COLORS[scheme];
  try {
    if (atLeast(tg, "6.1")) {
      tg.setHeaderColor?.(color);
      tg.setBackgroundColor?.(color);
    }
    if (atLeast(tg, "7.10")) tg.setBottomBarColor?.(color);
  } catch {
    /* ignore */
  }
}

/** Subscribe to a Telegram WebApp event (e.g. themeChanged, activated). */
export function useTelegramEvent(event: string, handler: () => void) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  }, [handler]);
  useEffect(() => {
    const tg = webApp();
    if (!tg?.onEvent) return;
    const cb = () => ref.current();
    tg.onEvent(event, cb);
    return () => tg.offEvent?.(event, cb);
  }, [event]);
}

/** Telegram BackButton: visible in a game, takes the player back to the lobby. */
export function useBackButton(visible: boolean, onBack?: () => void) {
  const ref = useRef(onBack);
  const hasHandler = !!onBack;
  useEffect(() => {
    ref.current = onBack;
  }, [onBack]);
  useEffect(() => {
    const tg = webApp();
    const bb = tg?.BackButton;
    if (!tg || !bb || !atLeast(tg, "6.1")) return;
    const cb = () => ref.current?.();
    if (visible && hasHandler) {
      bb.onClick(cb);
      bb.show();
    } else {
      bb.hide();
    }
    return () => {
      bb.offClick(cb);
      bb.hide();
    };
  }, [visible, hasHandler]);
}

/** Ask before closing the Mini App while a PvP game is in progress. */
export function useClosingConfirmation(enabled: boolean) {
  useEffect(() => {
    const tg = webApp();
    if (!tg || !atLeast(tg, "6.2")) return;
    try {
      if (enabled) tg.enableClosingConfirmation?.();
      else tg.disableClosingConfirmation?.();
    } catch {
      /* ignore */
    }
    return () => {
      try {
        tg.disableClosingConfirmation?.();
      } catch {
        /* ignore */
      }
    };
  }, [enabled]);
}
