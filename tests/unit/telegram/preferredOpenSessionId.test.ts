import { describe, expect, it } from "vitest";
import { preferredOpenSessionId } from "../../../src/telegram/cards";

describe("preferredOpenSessionId", () => {
  it("returns undefined for empty slots", () => {
    expect(preferredOpenSessionId([])).toBeUndefined();
  });

  it("prefers first waiting over earlier finished", () => {
    expect(
      preferredOpenSessionId([
        { sessionId: "s1", status: "finished" },
        { sessionId: "s2", status: "waiting" },
        { sessionId: "s3", status: "active" },
      ]),
    ).toBe("s2");
  });

  it("prefers active when no waiting", () => {
    expect(
      preferredOpenSessionId([
        { sessionId: "s1", status: "finished" },
        { sessionId: "s2", status: "pie" },
      ]),
    ).toBe("s2");
  });

  it("falls back to first slot", () => {
    expect(
      preferredOpenSessionId([{ sessionId: "s1", status: "finished" }]),
    ).toBe("s1");
  });
});
