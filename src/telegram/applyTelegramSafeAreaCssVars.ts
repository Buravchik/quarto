/**
 * Mirror Telegram Bot API 8+ safe-area fields onto documentElement CSS vars.
 * Clients usually set these already; we re-apply so older / partial injects still work
 * and so safeAreaChanged / contentSafeAreaChanged stay in sync with .ex-app padding.
 */
export function applyTelegramSafeAreaCssVars(
  root: CSSStyleDeclaration | null = typeof document !== "undefined" ? document.documentElement.style : null,
): void {
  if (typeof window === "undefined" || !root) return;
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  const write = (prefix: "--tg-safe-area-inset" | "--tg-content-safe-area-inset", inset?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }) => {
    if (!inset) return;
    for (const side of ["top", "bottom", "left", "right"] as const) {
      const value = inset[side];
      if (typeof value === "number" && Number.isFinite(value)) {
        root.setProperty(`${prefix}-${side}`, `${value}px`);
      }
    }
  };

  write("--tg-safe-area-inset", tg.safeAreaInset);
  write("--tg-content-safe-area-inset", tg.contentSafeAreaInset);
}

/** Subscribe to inset change events; returns unsubscribe. */
export function watchTelegramSafeAreaCssVars(): () => void {
  if (typeof window === "undefined") return () => undefined;
  applyTelegramSafeAreaCssVars();
  const tg = window.Telegram?.WebApp;
  if (!tg?.onEvent) return () => undefined;

  const onChange = () => applyTelegramSafeAreaCssVars();
  tg.onEvent("safeAreaChanged", onChange);
  tg.onEvent("contentSafeAreaChanged", onChange);
  tg.onEvent("fullscreenChanged", onChange);

  return () => {
    tg.offEvent?.("safeAreaChanged", onChange);
    tg.offEvent?.("contentSafeAreaChanged", onChange);
    tg.offEvent?.("fullscreenChanged", onChange);
  };
}
