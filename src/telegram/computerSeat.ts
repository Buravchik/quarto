/** Sentinel Telegram user id for the computer opponent seat. Never accept as client auth. */
export const COMPUTER_USER_ID = "computer";

export type Difficulty = "easy" | "normal" | "hard" | "expert";

export const DIFFICULTIES: readonly Difficulty[] = [
  "easy",
  "normal",
  "hard",
  "expert",
] as const;

export function isDifficulty(v: unknown): v is Difficulty {
  return typeof v === "string" && (DIFFICULTIES as readonly string[]).includes(v);
}

export function isComputerSeat(seat: { telegramUserId: string } | null | undefined): boolean {
  return seat?.telegramUserId === COMPUTER_USER_ID;
}
