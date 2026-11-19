/** 24h stall after turnNotifiedAt before waiting seat may claim (FR-014). */
export const TIMEOUT_MS = 24 * 60 * 60 * 1000;

export function timeoutReady(
  turnNotifiedAt: string | null,
  now: Date = new Date(),
): { ready: boolean; retryAfterSeconds: number } {
  if (!turnNotifiedAt) {
    return { ready: false, retryAfterSeconds: Math.ceil(TIMEOUT_MS / 1000) };
  }
  const elapsed = now.getTime() - new Date(turnNotifiedAt).getTime();
  if (elapsed >= TIMEOUT_MS) {
    return { ready: true, retryAfterSeconds: 0 };
  }
  return {
    ready: false,
    retryAfterSeconds: Math.ceil((TIMEOUT_MS - elapsed) / 1000),
  };
}

/** Waiting seat = the one who is NOT turnSeat. */
export function canClaimTimeout(opts: {
  turnSeat: 0 | 1 | null;
  claimingSeat: 0 | 1;
  turnNotifiedAt: string | null;
  phase: string;
  now?: Date;
}): { ok: true } | { ok: false; error: "timeout_too_early" | "wrong_phase" | "not_waiting_seat"; retryAfterSeconds?: number } {
  if (opts.phase === "waiting" || opts.phase === "finished") {
    return { ok: false, error: "wrong_phase" };
  }
  if (opts.turnSeat === null || opts.turnSeat === opts.claimingSeat) {
    return { ok: false, error: "not_waiting_seat" };
  }
  const gate = timeoutReady(opts.turnNotifiedAt, opts.now);
  if (!gate.ready) {
    return { ok: false, error: "timeout_too_early", retryAfterSeconds: gate.retryAfterSeconds };
  }
  return { ok: true };
}
