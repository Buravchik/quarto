export const ACHIEVEMENT_IDS = [
  "first_match",
  "first_quarto",
  "drawn_board",
  "rematch",
  "host",
  "comeback_seat",
] as const;

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

export const PIN_MAX = 2;

export function isAchievementId(id: string): id is AchievementId {
  return (ACHIEVEMENT_IDS as readonly string[]).includes(id);
}

export function validatePins(
  pinned: string[],
): { ok: true; pinned: AchievementId[] } | { ok: false; error: string } {
  if (pinned.length > PIN_MAX) {
    return { ok: false, error: "pin_max" };
  }
  const out: AchievementId[] = [];
  for (const id of pinned) {
    if (!isAchievementId(id)) return { ok: false, error: "unknown_achievement" };
    out.push(id);
  }
  return { ok: true, pinned: out };
}

export type MatchOutcome = {
  type: "win" | "draw" | "resign" | "timeout";
  winnerSeat?: 0 | 1;
  declaredSet?: number[];
} | null;

/** Unlock ids for a seated player after match end / host / rematch. */
export function unlocksAfterMatch(opts: {
  seat: 0 | 1;
  outcome: MatchOutcome;
  pieRule: boolean;
  pieResolved: boolean;
  acceptedRematch?: boolean;
  isHost?: boolean;
}): AchievementId[] {
  const ids: AchievementId[] = ["first_match"];
  const o = opts.outcome;
  if (o?.type === "draw") ids.push("drawn_board");
  if (o?.type === "win" && o.winnerSeat === opts.seat && o.declaredSet) {
    ids.push("first_quarto");
  }
  if (opts.pieRule && opts.pieResolved && o?.type === "win" && o.winnerSeat === opts.seat) {
    ids.push("comeback_seat");
  }
  if (opts.acceptedRematch) ids.push("rematch");
  if (opts.isHost) ids.push("host");
  return [...new Set(ids)];
}
