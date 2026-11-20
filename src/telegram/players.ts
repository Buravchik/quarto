import { eq } from "drizzle-orm";
import { getDb } from "../../db/client";
import { players } from "../../db/schema";
import {
  type AchievementId,
  unlocksAfterMatch,
  validatePins,
  type MatchOutcome,
} from "../quarto/achievements";
import type { TelegramWebAppUser } from "./initData";

/** Human-readable label from Telegram identity (never prefer bare id when name exists). */
export function displayNameFromTelegram(user: {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
}): string {
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (user.username?.trim()) return `@${user.username.trim()}`;
  if (user.id != null && String(user.id)) return String(user.id);
  return "";
}

export function displayNameFromInitUser(user: TelegramWebAppUser): string {
  return displayNameFromTelegram(user);
}

export async function ensurePlayer(
  telegramUserId: string,
  displayName = "",
  language?: string,
) {
  const db = getDb();
  const lang = language?.toLowerCase().startsWith("ru")
    ? "ru"
    : language
      ? "en"
      : undefined;
  const existing = await db
    .select()
    .from(players)
    .where(eq(players.telegramUserId, telegramUserId))
    .limit(1);
  if (existing[0]) {
    const nextName = displayName.trim();
    const patch: { displayName?: string; language?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    let changed = false;
    if (nextName && nextName !== existing[0].displayName) {
      patch.displayName = nextName;
      changed = true;
    }
    if (lang && lang !== existing[0].language) {
      patch.language = lang;
      changed = true;
    }
    if (changed) {
      await db
        .update(players)
        .set(patch)
        .where(eq(players.telegramUserId, telegramUserId));
      return {
        ...existing[0],
        displayName: patch.displayName ?? existing[0].displayName,
        language: patch.language ?? existing[0].language,
      };
    }
    return existing[0];
  }
  await db.insert(players).values({
    telegramUserId,
    displayName: displayName.trim(),
    language: lang ?? "en",
    achievementIds: [],
    pinnedAchievementIds: [],
  });
  const rows = await db
    .select()
    .from(players)
    .where(eq(players.telegramUserId, telegramUserId))
    .limit(1);
  return rows[0]!;
}

export async function getAchievements(telegramUserId: string) {
  const row = await ensurePlayer(telegramUserId);
  return {
    unlocked: (row.achievementIds as string[]) ?? [],
    pinned: (row.pinnedAchievementIds as string[]) ?? [],
  };
}

export async function pinAchievements(telegramUserId: string, pinned: string[]) {
  const check = validatePins(pinned);
  if (!check.ok) return { error: check.error as string };
  const row = await ensurePlayer(telegramUserId);
  const unlocked = new Set((row.achievementIds as string[]) ?? []);
  for (const id of check.pinned) {
    if (!unlocked.has(id)) return { error: "not_unlocked" as const };
  }
  const db = getDb();
  await db
    .update(players)
    .set({ pinnedAchievementIds: check.pinned, updatedAt: new Date() })
    .where(eq(players.telegramUserId, telegramUserId));
  return getAchievements(telegramUserId);
}

export async function grantAchievements(telegramUserId: string, ids: AchievementId[]) {
  const row = await ensurePlayer(telegramUserId);
  const current = new Set((row.achievementIds as string[]) ?? []);
  for (const id of ids) current.add(id);
  const db = getDb();
  await db
    .update(players)
    .set({ achievementIds: [...current], updatedAt: new Date() })
    .where(eq(players.telegramUserId, telegramUserId));
}

export async function grantMatchUnlocks(opts: {
  seat0UserId: string | undefined;
  seat1UserId: string | undefined;
  outcome: MatchOutcome;
  pieRule: boolean;
  pieResolved: boolean;
  cardOwnerId?: string;
}) {
  for (const [seat, uid] of [
    [0, opts.seat0UserId],
    [1, opts.seat1UserId],
  ] as const) {
    if (!uid) continue;
    const ids = unlocksAfterMatch({
      seat,
      outcome: opts.outcome,
      pieRule: opts.pieRule,
      pieResolved: opts.pieResolved,
      isHost: opts.cardOwnerId === uid,
    });
    await grantAchievements(uid, ids);
  }
}
