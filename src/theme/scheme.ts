export type ExScheme = "light" | "dark";

/** Resolve Expressive scheme from Telegram WebApp or prefers-color-scheme. */
export function resolveScheme(input?: {
  telegramColorScheme?: string | null;
  prefersDark?: boolean;
}): ExScheme {
  const tg = input?.telegramColorScheme?.toLowerCase();
  if (tg === "light" || tg === "dark") return tg;
  if (input?.prefersDark === false) return "light";
  if (input?.prefersDark === true) return "dark";
  if (typeof window !== "undefined") {
    const fromTg = window.Telegram?.WebApp?.colorScheme;
    if (fromTg === "light" || fromTg === "dark") return fromTg;
    if (window.matchMedia?.("(prefers-color-scheme: light)").matches) return "light";
  }
  return "dark";
}

export function applySchemeToDocument(scheme: ExScheme, root: HTMLElement = document.documentElement) {
  root.dataset.exScheme = scheme;
}
