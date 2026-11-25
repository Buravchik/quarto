import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCoalescer,
  isMessageGone,
  isNotModified,
  retryAfterSeconds,
} from "../../../src/telegram/liveEdit";

const tgError = (code: number, description: string, retry_after?: number) =>
  Object.assign(new Error(description), {
    response: { error_code: code, description, parameters: retry_after ? { retry_after } : undefined },
  });

describe("telegram error helpers", () => {
  it("reads retry_after from a 429", () => {
    expect(retryAfterSeconds(tgError(429, "Too Many Requests: retry after 7", 7))).toBe(7);
    expect(retryAfterSeconds(tgError(400, "Bad Request"))).toBeNull();
  });

  it("detects not-modified and gone messages", () => {
    expect(isNotModified(tgError(400, "Bad Request: message is not modified"))).toBe(true);
    expect(isMessageGone(tgError(400, "Bad Request: message to edit not found"))).toBe(true);
    expect(isMessageGone(tgError(400, "Bad Request: message is not modified"))).toBe(false);
  });
});

describe("createCoalescer (021 live card)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("runs the first edit immediately and collapses a burst into one trailing edit", async () => {
    const c = createCoalescer({ minIntervalMs: 1000, now: () => Date.now() });
    const calls: string[] = [];
    await c.run("card:1", async () => void calls.push("a"));
    expect(calls).toEqual(["a"]);

    // Burst inside the window: only the latest survives.
    await c.run("card:1", async () => void calls.push("b"));
    await c.run("card:1", async () => void calls.push("c"));
    await c.run("card:1", async () => void calls.push("d"));
    expect(calls).toEqual(["a"]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls).toEqual(["a", "d"]);
    expect(c.pendingCount()).toBe(0);
  });

  it("keys are independent", async () => {
    const c = createCoalescer({ minIntervalMs: 1000, now: () => Date.now() });
    const calls: string[] = [];
    await c.run("card:1", async () => void calls.push("1"));
    await c.run("card:2", async () => void calls.push("2"));
    expect(calls).toEqual(["1", "2"]);
  });

  it("retries after Telegram 429 retry_after", async () => {
    const c = createCoalescer({ minIntervalMs: 500, now: () => Date.now(), onError: () => undefined });
    let attempts = 0;
    const task = async () => {
      attempts++;
      if (attempts === 1) throw tgError(429, "Too Many Requests", 3);
    };
    await c.run("card:1", task);
    expect(attempts).toBe(1);
    await vi.advanceTimersByTimeAsync(2000);
    expect(attempts).toBe(1); // still waiting out retry_after
    await vi.advanceTimersByTimeAsync(1100);
    expect(attempts).toBe(2);
  });

  it("treats 'message is not modified' as success (no onError)", async () => {
    const onError = vi.fn();
    const c = createCoalescer({ minIntervalMs: 100, now: () => Date.now(), onError });
    await c.run("card:1", async () => {
      throw tgError(400, "Bad Request: message is not modified");
    });
    expect(onError).not.toHaveBeenCalled();
  });
});
