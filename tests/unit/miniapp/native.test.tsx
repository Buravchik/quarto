import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHROME_COLORS,
  haptic,
  syncTelegramChrome,
  useBackButton,
  useClosingConfirmation,
  useTelegramEvent,
} from "../../../src/telegram/native";

function installWebApp(version = "8.0") {
  const handlers = new Map<string, () => void>();
  const tg = {
    version,
    isVersionAtLeast: (v: string) => parseFloat(version) >= parseFloat(v),
    BackButton: { show: vi.fn(), hide: vi.fn(), onClick: vi.fn(), offClick: vi.fn() },
    HapticFeedback: { impactOccurred: vi.fn(), notificationOccurred: vi.fn(), selectionChanged: vi.fn() },
    enableClosingConfirmation: vi.fn(),
    disableClosingConfirmation: vi.fn(),
    setHeaderColor: vi.fn(),
    setBackgroundColor: vi.fn(),
    setBottomBarColor: vi.fn(),
    onEvent: vi.fn((e: string, cb: () => void) => handlers.set(e, cb)),
    offEvent: vi.fn((e: string) => handlers.delete(e)),
  };
  (window as unknown as { Telegram: unknown }).Telegram = { WebApp: tg };
  return { tg, handlers };
}

beforeEach(() => {
  delete (window as { Telegram?: unknown }).Telegram;
});
afterEach(() => {
  delete (window as { Telegram?: unknown }).Telegram;
});

describe("021 P0 native basics", () => {
  it("haptic is a no-op outside Telegram and maps kinds inside", () => {
    expect(() => haptic("success")).not.toThrow();
    const { tg } = installWebApp();
    haptic("select");
    haptic("light");
    haptic("error");
    expect(tg.HapticFeedback.selectionChanged).toHaveBeenCalledTimes(1);
    expect(tg.HapticFeedback.impactOccurred).toHaveBeenCalledWith("light");
    expect(tg.HapticFeedback.notificationOccurred).toHaveBeenCalledWith("error");
  });

  it("BackButton shows in a game, wires the click, hides on unmount", () => {
    const { tg } = installWebApp();
    const onBack = vi.fn();
    const { unmount } = renderHook(() => useBackButton(true, onBack));
    expect(tg.BackButton.show).toHaveBeenCalled();
    const cb = tg.BackButton.onClick.mock.calls[0]![0] as () => void;
    cb();
    expect(onBack).toHaveBeenCalled();
    unmount();
    expect(tg.BackButton.offClick).toHaveBeenCalledWith(cb);
    expect(tg.BackButton.hide).toHaveBeenCalled();
  });

  it("BackButton hidden in the lobby", () => {
    const { tg } = installWebApp();
    renderHook(() => useBackButton(false, () => undefined));
    expect(tg.BackButton.show).not.toHaveBeenCalled();
    expect(tg.BackButton.hide).toHaveBeenCalled();
  });

  it("closing confirmation follows the active-PvP flag", () => {
    const { tg } = installWebApp();
    const { rerender } = renderHook(({ on }) => useClosingConfirmation(on), {
      initialProps: { on: true },
    });
    expect(tg.enableClosingConfirmation).toHaveBeenCalledTimes(1);
    rerender({ on: false });
    expect(tg.disableClosingConfirmation).toHaveBeenCalled();
  });

  it("theme sync paints Telegram header/background with the app surface", () => {
    const { tg } = installWebApp();
    syncTelegramChrome("light");
    expect(tg.setHeaderColor).toHaveBeenCalledWith(CHROME_COLORS.light);
    expect(tg.setBackgroundColor).toHaveBeenCalledWith(CHROME_COLORS.light);
    expect(tg.setBottomBarColor).toHaveBeenCalledWith(CHROME_COLORS.light);
  });

  it("old clients: version-gated calls are skipped", () => {
    const { tg } = installWebApp("6.0");
    syncTelegramChrome("dark");
    haptic("light");
    expect(tg.setHeaderColor).not.toHaveBeenCalled();
    expect(tg.HapticFeedback.impactOccurred).not.toHaveBeenCalled();
  });

  it("useTelegramEvent subscribes (activated → refresh) and unsubscribes", () => {
    const { tg, handlers } = installWebApp();
    const refresh = vi.fn();
    const { unmount } = renderHook(() => useTelegramEvent("activated", refresh));
    handlers.get("activated")?.();
    expect(refresh).toHaveBeenCalledTimes(1);
    unmount();
    expect(tg.offEvent).toHaveBeenCalled();
  });
});
