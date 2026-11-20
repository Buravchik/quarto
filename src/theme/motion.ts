/** Whether Expressive springs should reduce to short fades. */
export function prefersReducedMotion(input?: { mediaMatches?: boolean }): boolean {
  if (typeof input?.mediaMatches === "boolean") return input.mediaMatches;
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return false;
}

export function springClass(kind: "emphasized" | "standard" = "standard"): string {
  return prefersReducedMotion() ? "ex-motion-reduced" : `ex-spring-${kind}`;
}
