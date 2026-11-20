import { describe, expect, it } from "vitest";
import { classic4 } from "../../../src/quarto/modules/classic4";
import { decodeChannels } from "../../../src/pieces/decode";
import { classic4ChannelMap } from "../../../src/pieces/classic4Channels";

describe("classic4 channel decode", () => {
  it("maps all 16 pieces to four channels", () => {
    for (const id of classic4.pieceSet.pieceIds) {
      const mask = classic4.pieceSet.traits[id]!;
      const ch = decodeChannels("classic4", id, mask);
      expect(ch).not.toBeNull();
      expect(ch!.tone).toMatch(/light|dark/);
      expect(ch!.stature).toMatch(/tall|short/);
      expect(ch!.plan).toMatch(/round|square/);
      expect(ch!.aperture).toMatch(/hollow|solid/);
    }
  });

  it("uses orthogonal bits per data-model table", () => {
    // p0 = 0 → all false
    expect(decodeChannels("classic4", "p0")).toEqual({
      tone: "dark",
      stature: "short",
      plan: "square",
      aperture: "solid",
    });
    // pf = 15 → all true
    expect(decodeChannels("classic4", "pf")).toEqual({
      tone: "light",
      stature: "tall",
      plan: "round",
      aperture: "hollow",
    });
  });

  it("registers four distinct bit indices", () => {
    const bits = classic4ChannelMap.channels.map((c) => c.bitIndex).sort();
    expect(bits).toEqual([0, 1, 2, 3]);
  });
});
