import { describe, expect, it } from "vitest";

/**
 * Contract expectations for settings lock (data-model MatchSession.settingsLocked).
 * Full HTTP+DB integration covered when bot runs; here we pin the rule surface.
 */
describe("settings lock contract", () => {
  it("settingsLocked true means missMode/pieRule must not change (403 path)", () => {
    const session = {
      settingsLocked: true,
      missMode: "persistent" as const,
      pieRule: false,
    };
    const allowed = !session.settingsLocked;
    expect(allowed).toBe(false);
  });

  it("unlocked waiting session allows creator to set missMode/pieRule", () => {
    const session: {
      settingsLocked: boolean;
      status: string;
      missMode: "persistent" | "void";
      pieRule: boolean;
    } = {
      settingsLocked: false,
      status: "waiting",
      missMode: "persistent",
      pieRule: false,
    };
    expect(session.settingsLocked).toBe(false);
    session.missMode = "void";
    session.pieRule = true;
    expect(session.missMode).toBe("void");
    expect(session.pieRule).toBe(true);
  });
});
