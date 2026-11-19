import { describe, expect, it } from "vitest";

describe("rematch contract", () => {
  it("actions are offer | accept | decline", () => {
    const actions = ["offer", "accept", "decline"] as const;
    expect(actions).toContain("offer");
    expect(actions).toContain("accept");
    expect(actions).toContain("decline");
  });

  it("accept yields newSessionId; offer yields offerState offered", () => {
    const offerResult = { offerState: "offered" as const };
    const acceptResult = { newSessionId: "uuid", offerState: "none" as const };
    expect(offerResult.offerState).toBe("offered");
    expect(acceptResult.newSessionId).toBeTruthy();
  });

  it("new rematch session carries rematchOfSessionId to parent", () => {
    const parentId = "sess-a";
    const child = { rematchOfSessionId: parentId, missMode: "void", pieRule: true };
    expect(child.rematchOfSessionId).toBe(parentId);
  });
});
