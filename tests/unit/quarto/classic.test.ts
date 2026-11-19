import { describe, expect, it } from "vitest";
import { applyIntent, createInitialState, startMatch } from "../../../src/quarto/engine";
import { isQuartoSet } from "../../../src/quarto/lines";

describe("classic lines", () => {
  it("detects shared trait on a row", () => {
    const board = Array(16).fill(null) as (string | null)[];
    // pieces with bit0 set: p1,p3,p5,p7 (odd)
    board[0] = "p1";
    board[1] = "p3";
    board[2] = "p5";
    board[3] = "p7";
    expect(isQuartoSet(board, [0, 1, 2, 3])).toBe(true);
  });

  it("rejects incomplete set", () => {
    const board = Array(16).fill(null) as (string | null)[];
    board[0] = "p1";
    board[1] = "p3";
    board[2] = "p5";
    expect(isQuartoSet(board, [0, 1, 2, 3])).toBe(false);
  });
});

describe("classic engine", () => {
  it("give → place → declare win", () => {
    let s = startMatch(createInitialState(), 0);
    let r = applyIntent(s, 0, { type: "give", pieceId: "p1" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    s = r.state;
    expect(s.phase).toBe("place_received");
    expect(s.turnSeat).toBe(1);

    // Place p1 then build a winning row artificially via multiple moves is heavy;
    // place then force board for declare path:
    r = applyIntent(s, 1, { type: "place", cellIndex: 0 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    s = r.state;

    // Fill a winning row for seat 1 declare (they last placed)
    s.board[0] = "p1";
    s.board[1] = "p3";
    s.board[2] = "p5";
    s.board[3] = "p7";
    s.lastPlacerSeat = 1;
    s.phase = "select_give";
    s.turnSeat = 1;

    r = applyIntent(s, 1, { type: "declare", setCells: [0, 1, 2, 3] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.phase).toBe("finished");
    expect(r.state.outcome?.type).toBe("win");
    expect(r.state.outcome?.winnerSeat).toBe(1);
  });

  it("illegal declare keeps match going", () => {
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
    if (r.ok) return;
    expect(r.error).toBe("illegal_declare");
    expect(r.state.phase).not.toBe("finished");
  });

  it("full board without win is draw", () => {
    let s = startMatch(createInitialState(), 0);
    // Fill 15 cells, one empty, last place fills
    s.phase = "place_received";
    s.turnSeat = 0;
    s.pieceInHand = "p0";
    s.pool = [];
    s.board = Array(16)
      .fill(null)
      .map((_, i) => (i === 15 ? null : `p${((i % 15) + 1).toString(16)}`));
    const r = applyIntent(s, 0, { type: "place", cellIndex: 15 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.outcome?.type).toBe("draw");
  });
});
