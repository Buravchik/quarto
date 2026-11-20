import { describe, expect, it } from "vitest";
import { formatCardMessage } from "../../../src/telegram/cards";

const baseView = {
  cardId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  surface: "dm" as const,
  chatId: null,
  messageId: null,
  slots: [
    {
      sessionId: "s1",
      status: "waiting",
      missMode: "persistent",
      pieRule: false,
      declareHints: false,
      modules: ["classic4"],
      seats: [{ telegramUserId: "1", joinedAt: "" }, null] as [
        { telegramUserId: string; joinedAt: string } | null,
        { telegramUserId: string; joinedAt: string } | null,
      ],
      seatLabels: ["Alice", "—"] as [string, string],
      turnSeat: null as 0 | 1 | null,
      outcome: null,
    },
  ],
};

describe("formatCardMessage", () => {
  it("drops Surface and uses RU waiting copy", () => {
    const text = formatCardMessage(baseView, "ru");
    expect(text).not.toMatch(/Surface:/i);
    expect(text).toContain("Кварто");
    expect(text).toContain("Ждём соперника");
    expect(text).toContain("Alice vs —");
  });

  it("names whose turn on active slot", () => {
    const view = {
      ...baseView,
      slots: [
        {
          ...baseView.slots[0]!,
          status: "active",
          seatLabels: ["Alice", "Bob"] as [string, string],
          turnSeat: 1 as 0 | 1,
        },
      ],
    };
    const text = formatCardMessage(view, "en");
    expect(text).toContain("Bob's turn");
    expect(text).not.toMatch(/turn seat/i);
  });
});
