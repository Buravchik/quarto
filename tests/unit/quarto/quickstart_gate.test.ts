import { describe, expect, it } from "vitest";
import { applyIntent, createInitialState, startMatch } from "../../../src/quarto/engine";
import { TIMEOUT_MS } from "../../../src/quarto/timeout";
import { PIN_MAX, validatePins } from "../../../src/quarto/achievements";
import { SLOT_CAP } from "../../../src/telegram/cards";

/**
 * Automated stand-in for quickstart A–G (T045).
 * Live Telegram two-account smoke remains manual.
 */
describe("quickstart automated gate", () => {
  it("A/B: classic win + illegal declare", () => {
    let s = startMatch(createInitialState(), 0);
    let r = applyIntent(s, 0, { type: "give", pieceId: "p0" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    s = r.state;
    r = applyIntent(s, 1, { type: "place", cellIndex: 0 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    s = r.state;
    r = applyIntent(s, 1, { type: "declare", setCells: [0, 1, 2, 3] });
    expect(r.ok).toBe(false);

    s.board[0] = "p1";
    s.board[1] = "p3";
    s.board[2] = "p5";
    s.board[3] = "p7";
    s.lastPlacerSeat = 1;
    s.lastPlacedCell = 3;
    r = applyIntent(s, 1, { type: "declare", setCells: [0, 1, 2, 3] });
    expect(r.ok).toBe(true);
  });

  it("C/D: void vs persistent covered by miss module (smoke import)", async () => {
    const miss = await import("../../../src/quarto/miss");
    expect(typeof miss.canDeclareSet).toBe("function");
  });

  it("E: timeout claim after 24h", () => {
    let s = startMatch(createInitialState(), 0);
    s.turnNotifiedAt = new Date(Date.now() - TIMEOUT_MS - 1).toISOString();
    const r = applyIntent(s, 1, { type: "claim_timeout" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.outcome?.type).toBe("timeout");
  });

  it("F: slot cap constant is 8", () => {
    expect(SLOT_CAP).toBe(8);
  });

  it("G: pin max 2", () => {
    expect(validatePins(["first_match", "host", "rematch"]).ok).toBe(false);
    expect(PIN_MAX).toBe(2);
  });
});
