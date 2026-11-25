import { describe, expect, it, vi } from "vitest";
import {
  handleChosenInlineResult,
  handleRefreshCallback,
  type InlineBindDeps,
} from "../../../src/telegram/inlineBind";

const SID = "11111111-2222-4333-8444-555555555555";

function fakeDeps(initialInline: string | null = null) {
  const card = { cardId: "card-1", inlineMessageId: initialInline };
  const deps: InlineBindDeps = {
    getSession: vi.fn(async (id: string) => (id === SID ? { cardId: card.cardId } : null)),
    getCard: vi.fn(async (id: string) => (id === card.cardId ? card : null)),
    setCardInlineMessage: vi.fn(async (_cardId: string, inlineId: string) => {
      card.inlineMessageId = inlineId;
    }),
    refreshCardMessage: vi.fn(async () => undefined),
  };
  return { deps, card };
}

describe("021 inline card binding without /setinlinefeedback", () => {
  it("🔄 on an inline card binds inline_message_id and refreshes the card", async () => {
    const { deps, card } = fakeDeps();
    const res = await handleRefreshCallback(deps, { data: `r:${SID}`, inline_message_id: "AgAAA_inline_1" });
    expect(res).toBe("bound");
    expect(card.inlineMessageId).toBe("AgAAA_inline_1");
    expect(deps.refreshCardMessage).toHaveBeenCalledWith("card-1");
  });

  it("second 🔄 on the same message only refreshes (no rewrite)", async () => {
    const { deps } = fakeDeps("AgAAA_inline_1");
    const res = await handleRefreshCallback(deps, { data: `r:${SID}`, inline_message_id: "AgAAA_inline_1" });
    expect(res).toBe("refreshed");
    expect(deps.setCardInlineMessage).not.toHaveBeenCalled();
    expect(deps.refreshCardMessage).toHaveBeenCalledTimes(1);
  });

  it("re-share: 🔄 on a newer copy moves the live card to it", async () => {
    const { deps, card } = fakeDeps("old_inline");
    expect(await handleRefreshCallback(deps, { data: `r:${SID}`, inline_message_id: "new_inline" })).toBe("bound");
    expect(card.inlineMessageId).toBe("new_inline");
  });

  it("🔄 on a chat copy (/new or bot DM, no inline id) just refreshes", async () => {
    const { deps } = fakeDeps();
    expect(await handleRefreshCallback(deps, { data: `r:${SID}` })).toBe("refreshed");
    expect(deps.setCardInlineMessage).not.toHaveBeenCalled();
    expect(deps.refreshCardMessage).toHaveBeenCalledWith("card-1");
  });

  it("ignores foreign / malformed callback data and unknown sessions", async () => {
    const { deps } = fakeDeps();
    expect(await handleRefreshCallback(deps, { data: "x:whatever", inline_message_id: "i" })).toBe("ignored");
    expect(await handleRefreshCallback(deps, { data: undefined, inline_message_id: "i" })).toBe("ignored");
    expect(
      await handleRefreshCallback(deps, { data: "r:99999999-0000-4000-8000-000000000000", inline_message_id: "i" }),
    ).toBe("not_found");
    expect(deps.refreshCardMessage).not.toHaveBeenCalled();
  });

  it("chosen_inline_result binds when feedback happens to be on", async () => {
    const { deps, card } = fakeDeps();
    expect(await handleChosenInlineResult(deps, { result_id: `s:${SID}`, inline_message_id: "chosen_1" })).toBe("bound");
    expect(card.inlineMessageId).toBe("chosen_1");
  });

  it("chosen_inline_result without inline_message_id or with a foreign id is ignored", async () => {
    const { deps } = fakeDeps();
    expect(await handleChosenInlineResult(deps, { result_id: `s:${SID}` })).toBe("ignored");
    expect(await handleChosenInlineResult(deps, { result_id: "legacy-uuid", inline_message_id: "x" })).toBe("ignored");
    expect(deps.setCardInlineMessage).not.toHaveBeenCalled();
  });
});
