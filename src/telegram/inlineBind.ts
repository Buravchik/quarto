/**
 * 021: bind a shared inline card (shareMessage / inline mode) to its game so it can be edited.
 *
 * Telegram only hands out `inline_message_id` in two places:
 * - `chosen_inline_result` — best effort, and only when /setinlinefeedback is on;
 * - `callback_query` from a button on that inline message — always.
 * So every inline card carries a 🔄 callback button (`r:<sessionId>`); the first tap binds it
 * and from then on the card is edited live. Works with inline feedback OFF.
 */
import { REFRESH_PREFIX, RESULT_PREFIX, parseSessionRef } from "./liveCard";

export type InlineBindDeps = {
  getSession: (sessionId: string) => Promise<{ cardId: string } | null>;
  getCard: (cardId: string) => Promise<{ inlineMessageId: string | null } | null>;
  setCardInlineMessage: (cardId: string, inlineMessageId: string) => Promise<void>;
  refreshCardMessage: (cardId: string) => Promise<void>;
};

export type BindResult = "bound" | "refreshed" | "ignored" | "not_found";

export async function bindInlineMessage(
  deps: InlineBindDeps,
  sessionId: string,
  inlineMessageId: string,
): Promise<BindResult> {
  const row = await deps.getSession(sessionId);
  if (!row) return "not_found";
  const card = await deps.getCard(row.cardId);
  if (!card) return "not_found";
  // Latest shared copy wins (re-shares move the live card to the newest message).
  const changed = card.inlineMessageId !== inlineMessageId;
  if (changed) await deps.setCardInlineMessage(row.cardId, inlineMessageId);
  await deps.refreshCardMessage(row.cardId);
  return changed ? "bound" : "refreshed";
}

/** chosen_inline_result (only if inline feedback is enabled). */
export async function handleChosenInlineResult(
  deps: InlineBindDeps,
  result: { result_id?: string; inline_message_id?: string },
): Promise<BindResult> {
  const sessionId = parseSessionRef(RESULT_PREFIX, result.result_id);
  if (!sessionId || !result.inline_message_id) return "ignored";
  return bindInlineMessage(deps, sessionId, result.inline_message_id);
}

/** 🔄 button: inline copy → bind + refresh; chat copy (/new, bot DM) → refresh only. */
export async function handleRefreshCallback(
  deps: InlineBindDeps,
  cq: { data?: string; inline_message_id?: string },
): Promise<BindResult> {
  const sessionId = parseSessionRef(REFRESH_PREFIX, cq.data);
  if (!sessionId) return "ignored";
  if (cq.inline_message_id) return bindInlineMessage(deps, sessionId, cq.inline_message_id);
  const row = await deps.getSession(sessionId);
  if (!row) return "not_found";
  await deps.refreshCardMessage(row.cardId);
  return "refreshed";
}
