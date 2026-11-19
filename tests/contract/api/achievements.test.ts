import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENT_IDS,
  PIN_MAX,
  validatePins,
} from "../../../src/quarto/achievements";

describe("achievements pin max 2", () => {
  it("ships six v1 achievement ids", () => {
    expect(ACHIEVEMENT_IDS).toHaveLength(6);
    expect(ACHIEVEMENT_IDS).toContain("first_match");
    expect(ACHIEVEMENT_IDS).toContain("host");
  });

  it("allows up to 2 pins", () => {
    const r = validatePins(["first_match", "host"]);
    expect(r.ok).toBe(true);
  });

  it("rejects more than 2 pins", () => {
    const r = validatePins(["first_match", "host", "rematch"]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("pin_max");
    expect(PIN_MAX).toBe(2);
  });

  it("rejects unknown achievement id", () => {
    const r = validatePins(["not_real"]);
    expect(r.ok).toBe(false);
  });
});
