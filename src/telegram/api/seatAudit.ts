import type { Seat } from "../sessions";

/** Resolve seated role for a Telegram user id; null if not seated. */
export function seatOf(
  seat0: Seat,
  seat1: Seat,
  telegramUserId: string,
): 0 | 1 | null {
  if (seat0?.telegramUserId === telegramUserId) return 0;
  if (seat1?.telegramUserId === telegramUserId) return 1;
  return null;
}

export function requireSeated(
  seat0: Seat,
  seat1: Seat,
  telegramUserId: string,
): { ok: true; seat: 0 | 1 } | { ok: false; error: "not_seated" } {
  const seat = seatOf(seat0, seat1, telegramUserId);
  if (seat === null) return { ok: false, error: "not_seated" };
  return { ok: true, seat };
}

/** Slot creator = seat0 only (settings / host). */
export function requireCreator(
  seat0: Seat,
  telegramUserId: string,
): { ok: true } | { ok: false; error: "forbidden" } {
  if (seat0?.telegramUserId !== telegramUserId) {
    return { ok: false, error: "forbidden" };
  }
  return { ok: true };
}
