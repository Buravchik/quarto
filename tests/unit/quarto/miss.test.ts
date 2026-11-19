import { describe, expect, it } from "vitest";
import { applyIntent, createInitialState, startMatch } from "../../../src/quarto/engine";

function withWinningRow(s: ReturnType<typeof createInitialState>, placer: 0 | 1) {
  s.board[0] = "p1";
  s.board[1] = "p3";
  s.board[2] = "p5";
  s.board[3] = "p7";
  s.lastPlacerSeat = placer;
  s.lastPlacedCell = 3;
  s.phase = "select_give";
  s.turnSeat = placer;
  s.pendingVoidSets = [[0, 1, 2, 3]];
  return s;
}

describe("Miss Persistent", () => {
  it("allows declare after own place through that cell", () => {
    let s = withWinningRow(startMatch(createInitialState({ missMode: "persistent" }), 0), 1);
    const r = applyIntent(s, 1, { type: "declare", setCells: [0, 1, 2, 3] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.outcome?.type).toBe("win");
  });

  it("rejects declare when not after own place", () => {
    let s = withWinningRow(startMatch(createInitialState({ missMode: "persistent" }), 0), 1);
    s.lastPlacerSeat = null;
    const r = applyIntent(s, 1, { type: "declare", setCells: [0, 1, 2, 3] });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("illegal_declare");
  });

  it("keeps set claimable later after own later place on that set", () => {
    let s = startMatch(createInitialState({ missMode: "persistent" }), 0);
    // Skip early: board has almost-line, no declare window
    s.board[0] = "p1";
    s.board[1] = "p3";
    s.board[2] = "p5";
    s.phase = "select_give";
    s.turnSeat = 1;
    s.lastPlacerSeat = null;
    s.lastPlacedCell = null;
    // Later own place completes the set
    s.phase = "place_received";
    s.pieceInHand = "p7";
    s.pool = s.pool.filter((p) => p !== "p7");
    let r = applyIntent(s, 1, { type: "place", cellIndex: 3 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    s = r.state;
    r = applyIntent(s, 1, { type: "declare", setCells: [0, 1, 2, 3] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.outcome?.type).toBe("win");
  });
});

describe("Miss Void", () => {
  it("lets receiver claim before place through last cell", () => {
    let s = startMatch(createInitialState({ missMode: "void" }), 0);
    s = withWinningRow(s, 0);
    // Placer gives without declaring → void claim open for receiver
    s.pool = ["p8", ...s.pool.filter((p) => !["p1", "p3", "p5", "p7"].includes(p))];
    let r = applyIntent(s, 0, { type: "give", pieceId: "p8" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    s = r.state;
    expect(s.voidClaimOpen).toBe(true);
    expect(s.phase).toBe("place_received");
    expect(s.turnSeat).toBe(1);

    r = applyIntent(s, 1, { type: "declare", setCells: [0, 1, 2, 3] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.outcome?.winnerSeat).toBe(1);
  });

  it("voids set after opponent places without claiming", () => {
    let s = startMatch(createInitialState({ missMode: "void" }), 0);
    s = withWinningRow(s, 0);
    s.pool = ["p8", "p9", ...s.pool.filter((p) => !["p1", "p3", "p5", "p7"].includes(p))];
    let r = applyIntent(s, 0, { type: "give", pieceId: "p8" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    s = r.state;

    r = applyIntent(s, 1, { type: "place", cellIndex: 4 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    s = r.state;
    expect(s.voidedSets.some((set) => set.join(",") === "0,1,2,3" || [...set].sort().join(",") === "0,1,2,3")).toBe(
      true,
    );

    // Later cannot declare that voided set even after own place on it
    s.lastPlacerSeat = 1;
    s.lastPlacedCell = 3;
    s.phase = "select_give";
    s.turnSeat = 1;
    r = applyIntent(s, 1, { type: "declare", setCells: [0, 1, 2, 3] });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("illegal_declare");
  });
});
