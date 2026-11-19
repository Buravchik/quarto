import { describe, expect, it } from "vitest";
import { createInitialState } from "../../../src/quarto/engine";

describe("engine shell", () => {
  it("boots classic4 empty board", () => {
    const s = createInitialState();
    expect(s.board).toHaveLength(16);
    expect(s.pool).toHaveLength(16);
    expect(s.phase).toBe("waiting");
    expect(s.modules).toEqual(["classic4"]);
  });
});
