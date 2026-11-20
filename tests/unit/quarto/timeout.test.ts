import { describe, expect, it } from "vitest";
import { applyIntent, createInitialState, startMatch } from "../../../src/quarto/engine";
import {
  TIMEOUT_MS,
  canClaimTimeout,
  formatTimeoutCountdown,
  timeoutReady,
} from "../../../src/quarto/timeout";

describe("timeout gating", () => {
  it("not ready before 8h", () => {
    const now = new Date("2026-11-19T12:00:00Z");
    const notified = new Date(now.getTime() - TIMEOUT_MS + 60_000).toISOString();
    const g = timeoutReady(notified, now);
    expect(g.ready).toBe(false);
    expect(g.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("ready after 8h", () => {
    const now = new Date("2026-11-19T12:00:00Z");
    const notified = new Date(now.getTime() - TIMEOUT_MS).toISOString();
    expect(timeoutReady(notified, now).ready).toBe(true);
  });

  it("formats countdown H:MM:SS", () => {
    expect(formatTimeoutCountdown(8 * 3600 + 5 * 60 + 7)).toBe("8:05:07");
    expect(formatTimeoutCountdown(59)).toBe("0:00:59");
  });

  it("only waiting seat may claim", () => {
    const notified = new Date(Date.now() - TIMEOUT_MS - 1).toISOString();
    expect(
      canClaimTimeout({
        turnSeat: 0,
        claimingSeat: 0,
        turnNotifiedAt: notified,
        phase: "select_give",
      }).ok,
    ).toBe(false);
    expect(
      canClaimTimeout({
        turnSeat: 0,
        claimingSeat: 1,
        turnNotifiedAt: notified,
        phase: "select_give",
      }).ok,
    ).toBe(true);
  });

  it("engine claim_timeout ends match for waiting seat after 8h", () => {
    let s = startMatch(createInitialState(), 0);
    s.turnNotifiedAt = new Date(Date.now() - TIMEOUT_MS - 1000).toISOString();
    const r = applyIntent(s, 1, { type: "claim_timeout" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.phase).toBe("finished");
    expect(r.state.outcome?.type).toBe("timeout");
    expect(r.state.outcome?.winnerSeat).toBe(1);
  });

  it("engine rejects early claim", () => {
    let s = startMatch(createInitialState(), 0);
    s.turnNotifiedAt = new Date().toISOString();
    const r = applyIntent(s, 1, { type: "claim_timeout" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("timeout_too_early");
  });
});
