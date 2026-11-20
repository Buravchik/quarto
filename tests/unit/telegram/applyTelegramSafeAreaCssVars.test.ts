/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTelegramSafeAreaCssVars } from "../../../src/telegram/applyTelegramSafeAreaCssVars";

describe("applyTelegramSafeAreaCssVars", () => {
  afterEach(() => {
    delete (window as { Telegram?: unknown }).Telegram;
  });

  it("writes --tg-safe-area-inset-* and --tg-content-safe-area-inset-* from WebApp", () => {
    const setProperty = vi.fn();
    window.Telegram = {
      WebApp: {
        safeAreaInset: { top: 10, bottom: 20, left: 0, right: 4 },
        contentSafeAreaInset: { top: 46, bottom: 0, left: 0, right: 0 },
      },
    };

    applyTelegramSafeAreaCssVars({ setProperty } as unknown as CSSStyleDeclaration);

    expect(setProperty).toHaveBeenCalledWith("--tg-safe-area-inset-top", "10px");
    expect(setProperty).toHaveBeenCalledWith("--tg-safe-area-inset-bottom", "20px");
    expect(setProperty).toHaveBeenCalledWith("--tg-safe-area-inset-right", "4px");
    expect(setProperty).toHaveBeenCalledWith("--tg-content-safe-area-inset-top", "46px");
  });

  it("no-ops without Telegram WebApp", () => {
    const setProperty = vi.fn();
    applyTelegramSafeAreaCssVars({ setProperty } as unknown as CSSStyleDeclaration);
    expect(setProperty).not.toHaveBeenCalled();
  });
});
