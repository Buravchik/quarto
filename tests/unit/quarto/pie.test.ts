import { describe, expect, it } from "vitest";
import { applyIntent, createInitialState, startMatch } from "../../../src/quarto/engine";

describe("Pie Rule", () => {
  it("OFF: after first place continues to select_give without pie_choice", () => {
    let s = startMatch(createInitialState({ pieRule: false }), 0);
    let r = applyIntent(s, 0, { type: "give", pieceId: "p0" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    s = r.state;
    r = applyIntent(s, 1, { type: "place", cellIndex: 0 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.phase).toBe("select_give");
    expect(r.state.turnSeat).toBe(1);
    expect(r.state.openerSeat).toBe(0);
  });

  it("ON: after first place enters pie_choice for placer", () => {
    let s = startMatch(createInitialState({ pieRule: true }), 0);
    let r = applyIntent(s, 0, { type: "give", pieceId: "p0" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    s = r.state;
    r = applyIntent(s, 1, { type: "place", cellIndex: 0 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.phase).toBe("pie_choice");
    expect(r.state.turnSeat).toBe(1);
  });

  it("pass keeps opener; placer gives next", () => {
    let s = startMatch(createInitialState({ pieRule: true }), 0);
    let r = applyIntent(s, 0, { type: "give", pieceId: "p0" });
    if (!r.ok) return;
    s = r.state;
    r = applyIntent(s, 1, { type: "place", cellIndex: 0 });
    if (!r.ok) return;
    s = r.state;
    r = applyIntent(s, 1, { type: "pie_choice", pieTake: false });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.phase).toBe("select_give");
    expect(r.state.openerSeat).toBe(0);
    expect(r.state.turnSeat).toBe(1);
    expect(r.state.pieResolved).toBe(true);
  });

  it("take makes placer opener; original opener gives next", () => {
    let s = startMatch(createInitialState({ pieRule: true }), 0);
    let r = applyIntent(s, 0, { type: "give", pieceId: "p0" });
    if (!r.ok) return;
    s = r.state;
    r = applyIntent(s, 1, { type: "place", cellIndex: 0 });
    if (!r.ok) return;
    s = r.state;
    r = applyIntent(s, 1, { type: "pie_choice", pieTake: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.openerSeat).toBe(1);
    expect(r.state.turnSeat).toBe(0);
    expect(r.state.phase).toBe("select_give");
  });
});
