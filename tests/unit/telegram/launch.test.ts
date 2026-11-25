import { describe, expect, it } from "vitest";
import { normalizeStartParam, resolveLaunchSessionId } from "../../../src/telegram/launch";

const INVITE = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const OLD = "11111111-2222-4333-8444-555555555555";

describe("resolveLaunchSessionId (021: start_param > ?sessionId)", () => {
  it("fresh invite start_param beats a stale ?sessionId of the vs-computer game", () => {
    expect(resolveLaunchSessionId({ startParam: INVITE, querySessionId: OLD })).toEqual({
      sessionId: INVITE,
      source: "start_param",
      consume: INVITE,
    });
  });

  it("an already consumed start_param does not override in-app navigation (rematch)", () => {
    expect(
      resolveLaunchSessionId({ startParam: INVITE, querySessionId: OLD, consumedStartParam: INVITE }),
    ).toEqual({ sessionId: OLD, source: "query" });
  });

  it("a NEW invite in the same WebView still wins", () => {
    const next = "99999999-8888-4777-8666-555555555555";
    expect(
      resolveLaunchSessionId({ startParam: next, querySessionId: OLD, consumedStartParam: INVITE }).sessionId,
    ).toBe(next);
  });

  it("falls back to query, then lobby", () => {
    expect(resolveLaunchSessionId({ querySessionId: OLD }).source).toBe("query");
    expect(resolveLaunchSessionId({}).sessionId).toBe("");
  });

  it("normalizes and validates start_param", () => {
    expect(normalizeStartParam(` s_${INVITE} `)).toBe(INVITE);
    expect(normalizeStartParam("<script>")).toBeNull();
    expect(normalizeStartParam("")).toBeNull();
  });
});
