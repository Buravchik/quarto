import { describe, expect, it } from "vitest";
import { sharedTraitLabelKeys } from "../../../src/quarto/sharedTraits";

/** classic4: bit0 tone light, bit1 tall, bit2 round, bit3 hollow */
function boardWith(cells: Record<number, string>): (string | null)[] {
  const b = Array.from({ length: 16 }, () => null as string | null);
  for (const [i, id] of Object.entries(cells)) b[Number(i)] = id;
  return b;
}

describe("sharedTraitLabelKeys", () => {
  it("lists all shared traits (solid + light)", () => {
    // p0 = 0b0000 dark short square solid
    // p1 = 0b0001 light short square solid
    // Wait — need four that share light AND solid:
    // light=bit0, solid=absence of bit3
    // p1=0001 light short square solid
    // p3=0011 light tall square solid
    // p5=0101 light short round solid
    // p7=0111 light tall round solid
    const board = boardWith({
      12: "p1",
      13: "p3",
      14: "p5",
      15: "p7",
    });
    const keys = sharedTraitLabelKeys(board, [12, 13, 14, 15]);
    expect(keys).toContain("traitToneLight");
    expect(keys).toContain("traitApertureSolid");
    expect(keys).not.toContain("traitStatureTall");
    expect(keys).not.toContain("traitPlanRound");
  });

  it("returns empty for incomplete set", () => {
    const board = boardWith({ 0: "p1", 1: "p3", 2: "p5" });
    expect(sharedTraitLabelKeys(board, [0, 1, 2])).toEqual([]);
  });
});
