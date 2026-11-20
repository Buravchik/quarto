import { describe, expect, it } from "vitest";
import { chooseIntent } from "../../../src/quarto/computer/policy";
import { isUnsafeGift, winningCellsForPiece } from "../../../src/quarto/computer/threats";
import {
  applyIntent,
  createInitialState,
  startMatch,
  type EngineState,
} from "../../../src/quarto/engine";

function boardWith(
  placements: Array<{ cell: number; piece: string }>,
  poolExtraRemove: string[] = [],
): EngineState {
  let s = startMatch(createInitialState({ missMode: "persistent", pieRule: false }), 0);
  // Manually craft board/pool for fixtures
  const board = Array(16).fill(null) as (string | null)[];
  const used = new Set<string>();
  for (const p of placements) {
    board[p.cell] = p.piece;
    used.add(p.piece);
  }
  for (const id of poolExtraRemove) used.add(id);
  const pool = s.pool.filter((id) => !used.has(id));
  return {
    ...s,
    board,
    pool,
    phase: "select_give",
    turnSeat: 0,
    pieceInHand: null,
    firstPlaceDone: true,
    pieResolved: true,
    lastPlacerSeat: null,
    lastPlacedCell: null,
    pendingVoidSets: [],
  };
}

describe("computer policy", () => {
  it("Normal never gifts an immediate win when a safe gift exists", () => {
    // Three light pieces on row 0 cells 0,1,2 — any light gift wins on cell 3
    // p0=0000 light tall round hollow? traits: bit0=tone? classic4: i bits
    // light = bit0 clear if tone is LSB — check classic4Channels
    // Use winningCellsForPiece to find a concrete unsafe piece then ensure safe exists
    const s = boardWith([
      { cell: 0, piece: "p0" },
      { cell: 1, piece: "p1" },
      { cell: 2, piece: "p2" },
    ]);
    const unsafe = s.pool.filter((id) => isUnsafeGift(s, id));
    const safe = s.pool.filter((id) => !isUnsafeGift(s, id));
    expect(unsafe.length).toBeGreaterThan(0);
    expect(safe.length).toBeGreaterThan(0);

    for (let i = 0; i < 20; i++) {
      const intent = chooseIntent(s, 0, { difficulty: "normal", rng: () => 0.99 });
      expect(intent?.type).toBe("give");
      if (intent?.type === "give") {
        expect(isUnsafeGift(s, intent.pieceId)).toBe(false);
      }
    }
  });

  it("Normal places on a winning cell when holding a mating piece", () => {
    const base = boardWith([
      { cell: 0, piece: "p0" },
      { cell: 1, piece: "p1" },
      { cell: 2, piece: "p2" },
    ]);
    const mating = base.pool.find((id) => winningCellsForPiece(base.board, id).includes(3));
    expect(mating).toBeTruthy();
    const s: EngineState = {
      ...base,
      phase: "place_received",
      turnSeat: 0,
      pieceInHand: mating!,
      pool: base.pool.filter((id) => id !== mating),
    };
    const intent = chooseIntent(s, 0, { difficulty: "normal" });
    expect(intent).toEqual({ type: "place", cellIndex: 3 });
    const placed = applyIntent(s, 0, intent!);
    expect(placed.ok).toBe(true);
    if (placed.ok) {
      const decl = chooseIntent(placed.state, 0, { difficulty: "normal" });
      expect(decl?.type).toBe("declare");
    }
  });

  it("Expert chooseIntent returns under 5s on midgame fixture", () => {
    const s = boardWith([
      { cell: 0, piece: "p0" },
      { cell: 5, piece: "p5" },
      { cell: 10, piece: "pa" },
      { cell: 15, piece: "pf" },
      { cell: 3, piece: "p3" },
      { cell: 7, piece: "p7" },
      { cell: 8, piece: "p8" },
      { cell: 12, piece: "pc" },
      { cell: 1, piece: "p1" },
      { cell: 2, piece: "p2" },
    ]);
    const t0 = Date.now();
    const intent = chooseIntent(
      { ...s, phase: "select_give", turnSeat: 0 },
      0,
      { difficulty: "expert" },
    );
    expect(Date.now() - t0).toBeLessThan(5000);
    expect(intent?.type).toBe("give");
  });
});
