# Feature Specification: Lobby CTA clarity

**Feature Branch**: `cursor/019-lobby-cta-clarity-3515` (feature id `019-lobby-cta-clarity`)

**Created**: 2026-11-22

**Status**: Clarified

## Clarifications

- **Q1 = B**: Human match is **primary** (top); computer is **secondary** (below).
- **Wording = 1**: Human CTA = «Играть с другом» / «Play with a friend» (not «вызвать человека»).
- **E1**: Difficulty control sits with the computer CTA (not above both).
- **E2**: Muted hint under CTAs matches the friend path by default; computer keeps its own short hint near that button.

## Requirements

- **FR-001**: Primary button starts human challenge; secondary starts vs-computer.
- **FR-002**: Labels per wording above (RU/EN).
- **FR-003**: Difficulty select only adjacent to computer CTA.
- **FR-004**: No API changes.
