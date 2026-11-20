import { describe, expect, it } from "vitest";
import { prefersReducedMotion } from "../../../src/theme/motion";
import { resolveScheme } from "../../../src/theme/scheme";

describe("expressive scheme helpers", () => {
  it("prefers telegram colorScheme when provided", () => {
    expect(resolveScheme({ telegramColorScheme: "light" })).toBe("light");
    expect(resolveScheme({ telegramColorScheme: "dark" })).toBe("dark");
  });

  it("falls back to prefersDark", () => {
    expect(resolveScheme({ prefersDark: false })).toBe("light");
    expect(resolveScheme({ prefersDark: true })).toBe("dark");
  });

  it("reduced motion flag", () => {
    expect(prefersReducedMotion({ mediaMatches: true })).toBe(true);
    expect(prefersReducedMotion({ mediaMatches: false })).toBe(false);
  });
});
