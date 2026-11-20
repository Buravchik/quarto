import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PieceToken } from "../../../src/pieces/PieceToken";

describe("PieceToken", () => {
  it("exposes data-piece-id and data-channel-* attributes", () => {
    const { container } = render(<PieceToken pieceId="pf" moduleId="classic4" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("data-piece-id")).toBe("pf");
    expect(svg?.getAttribute("data-channel-tone")).toBe("light");
    expect(svg?.getAttribute("data-channel-stature")).toBe("tall");
    expect(svg?.getAttribute("data-channel-plan")).toBe("round");
    expect(svg?.getAttribute("data-channel-aperture")).toBe("hollow");
  });

  it("marks unknown pieces as fallback", () => {
    const { container } = render(<PieceToken pieceId="nope" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("data-piece-fallback")).toBe("true");
  });
});
