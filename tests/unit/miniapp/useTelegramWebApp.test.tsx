import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTelegramWebApp } from "../../../src/telegram/useTelegramWebApp";

afterEach(() => {
  vi.useRealTimers();
  delete (window as { Telegram?: unknown }).Telegram;
});

describe("useTelegramWebApp initData race", () => {
  it("does not settle forever empty when Telegram arrives after first paint", async () => {
    // Simulate: script not loaded yet at mount (the production bug)
    delete (window as { Telegram?: unknown }).Telegram;

    const { result } = renderHook(() => useTelegramWebApp(2000));

    expect(result.current.ready).toBe(false);
    expect(result.current.initData).toBe("");

    // Telegram script appears late with real initData
    await act(async () => {
      window.Telegram = {
        WebApp: {
          initData: "query_id=smoke&user=%7B%22id%22%3A1%7D&auth_date=1&hash=abc",
          initDataUnsafe: { user: { id: 1, language_code: "en" } },
          ready: vi.fn(),
          expand: vi.fn(),
        },
      };
      await new Promise((r) => setTimeout(r, 80));
    });

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
      expect(result.current.initData.length).toBeGreaterThan(0);
      expect(result.current.outsideTelegram).toBe(false);
    });
  });

  it("one-shot read without polling would miss late Telegram (documents the bug class)", () => {
    delete (window as { Telegram?: unknown }).Telegram;
    const oneShot = window.Telegram?.WebApp?.initData ?? "";
    expect(oneShot).toBe("");

    window.Telegram = {
      WebApp: {
        initData: "user=%7B%22id%22%3A2%7D&auth_date=1&hash=x",
        ready: () => undefined,
        expand: () => undefined,
      },
    };
    // Without polling, a component that only ran the first line stays empty — regression guard is the hook test above.
    expect(oneShot).toBe("");
    expect(window.Telegram?.WebApp?.initData).toContain("user=");
  });

  it("marks outsideTelegram when WebApp never provides initData before timeout", async () => {
    vi.useFakeTimers();
    window.Telegram = {
      WebApp: {
        initData: "",
        ready: vi.fn(),
        expand: vi.fn(),
      },
    };

    const { result } = renderHook(() => useTelegramWebApp(500));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(result.current.ready).toBe(true);
    expect(result.current.initData).toBe("");
    expect(result.current.outsideTelegram).toBe(true);
  });
});
