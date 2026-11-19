import { describe, expect, it } from "vitest";
import { SLOT_CAP } from "../../../src/telegram/cards";

describe("slot cap", () => {
  it("hard cap is 8 per data-model ChallengeCard.slots", () => {
    expect(SLOT_CAP).toBe(8);
  });
});
