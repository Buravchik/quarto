import { describe, expect, it } from "vitest";
import { derivePlaySurfaceState } from "../../../src/play/derivePlaySurfaceState";

const base = {
  pieceInHand: null as string | null,
  seat0: { telegramUserId: "1" },
  seat1: { telegramUserId: "2" },
  outcome: null,
  pieRule: false,
};

describe("derivePlaySurfaceState", () => {
  it("give on my turn", () => {
    const s = derivePlaySurfaceState({
      ...base,
      status: "active",
      phase: "select_give",
      turnSeat: 0,
      viewerTelegramUserId: "1",
    });
    expect(s.expectedAction).toBe("give");
    expect(s.showGiveControls).toBe(true);
    expect(s.showPlaceControls).toBe(false);
    expect(s.isMyTurn).toBe(true);
  });

  it("place on my turn with hand", () => {
    const s = derivePlaySurfaceState({
      ...base,
      status: "active",
      phase: "place_received",
      turnSeat: 1,
      pieceInHand: "p3",
      viewerTelegramUserId: "2",
    });
    expect(s.expectedAction).toBe("place");
    expect(s.handEmphasis).toBe(true);
    expect(s.showPlaceControls).toBe(true);
  });

  it("wait when opponent to move", () => {
    const s = derivePlaySurfaceState({
      ...base,
      status: "active",
      phase: "select_give",
      turnSeat: 0,
      viewerTelegramUserId: "2",
    });
    expect(s.expectedAction).toBe("wait");
    expect(s.showGiveControls).toBe(false);
  });

  it("pie_choice for chooser only", () => {
    const mine = derivePlaySurfaceState({
      ...base,
      status: "active",
      phase: "pie_choice",
      turnSeat: 1,
      viewerTelegramUserId: "2",
    });
    expect(mine.expectedAction).toBe("pie_choice");
    expect(mine.showPieControls).toBe(true);

    const other = derivePlaySurfaceState({
      ...base,
      status: "active",
      phase: "pie_choice",
      turnSeat: 1,
      viewerTelegramUserId: "1",
    });
    expect(other.expectedAction).toBe("wait");
    expect(other.showPieControls).toBe(false);
  });

  it("finished", () => {
    const s = derivePlaySurfaceState({
      ...base,
      status: "finished",
      phase: "select_give",
      turnSeat: null,
      outcome: { type: "win", winnerSeat: 0 },
      viewerTelegramUserId: "1",
    });
    expect(s.expectedAction).toBe("finished");
  });

  it("join for non-seated; creator never join", () => {
    const join = derivePlaySurfaceState({
      ...base,
      status: "waiting",
      phase: "select_give",
      turnSeat: null,
      seat1: null,
      viewerTelegramUserId: "99",
    });
    expect(join.expectedAction).toBe("join");

    const creator = derivePlaySurfaceState({
      ...base,
      status: "waiting",
      phase: "select_give",
      turnSeat: null,
      seat1: null,
      viewerTelegramUserId: "1",
    });
    expect(creator.expectedAction).toBe("wait");
    expect(creator.primaryCta?.key).toBe("shareSession");
  });
});
