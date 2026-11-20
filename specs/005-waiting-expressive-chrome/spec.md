# Feature Specification: Waiting chrome density + Expressive fidelity

**Feature Branch**: `cursor/waiting-expressive-chrome-3515` (feature id `005-waiting-expressive-chrome`)

**Created**: 2026-11-20

**Status**: Implemented (awaiting Pages + human T009)

**Input**: On the waiting screen, three full-width stacked buttons waste vertical space (user: put actions on one row). The UI does not read as Material 3 Expressive — it looks homemade (thick gold brick primary, sparse layout, board pushed off-screen).

## Clarifications (encoded 2026-11-20)

- **Waiting actions layout**: Share + New match sit on **one horizontal row** (Share is primary). Debug link is a **compact text/link control**, not a full-width second brick.
- **Duplicate copy**: “Waiting for opponent” appears **once** (headline surface), not repeated as muted body under the actions.
- **Expressive fidelity**: Strengthen M3 Expressive cues already in contract 002 — asymmetric emphasized shapes, spring press, tonal elevation — and **remove** the homemade thick bottom-ledge “3D brick” primary that reads as custom CSS novelty, not Expressive.
- **Density**: Waiting chrome stays compact so the **board is visible in the first viewport** without scrolling past three stacked buttons.
- **Scope**: Presentation only; Telegram share/`web_app`/poll behavior from 003–004 unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compact waiting actions (Priority: P1)

While waiting for an opponent, the creator sees Share and New match on one row. Debug share is secondary/tertiary and does not consume a full button row. The board is visible without scrolling past a stack of three large buttons.

**Why this priority**: Screenshot shows half the viewport eaten by stacked CTAs; board nearly off-screen.

**Independent Test**: Open a waiting session on a phone-width viewport; actions are one row; board cells visible without scrolling past buttons.

**Acceptance Scenarios**:

1. **Given** creator waiting for seat 1, **When** they view the play surface, **Then** Share and New match appear on one horizontal row (not three stacked full-width bricks).
2. **Given** that waiting surface, **When** they look for debug share, **Then** it is a compact control (text/link or chip), not a full-width primary-height button.
3. **Given** a typical Mini App phone height, **When** waiting loads, **Then** at least part of the 4×4 board is visible without scrolling past the action row.

---

### User Story 2 - Expressive reads as Expressive (Priority: P1)

Waiting (and shared chrome) clearly shows Material 3 Expressive language: asymmetric emphasized shapes, springy primary press, tonal hierarchy — not a flat form with a thick gold brick button.

**Why this priority**: User explicitly said Expressive is not visible / looks like amateur work.

**Independent Test**: Side-by-side with 002 `expressive-theme.md` checklist: emphasized radius, spring press, primary tonal (no thick ledge shadow), display type hierarchy.

**Acceptance Scenarios**:

1. **Given** waiting or lobby, **When** a reviewer inspects primary CTA, **Then** it uses Expressive emphasized shape + spring press, without a thick bottom “ledge” shadow that reads as homemade 3D.
2. **Given** light or dark Telegram scheme, **When** viewing waiting chrome, **Then** surfaces use the Expressive token set (asymmetric emphasized containers where hierarchy needs it).
3. **Given** `prefers-reduced-motion`, **When** pressing primary, **Then** motion shortens without losing clarity.

---

### User Story 3 - Single waiting headline (Priority: P2)

Waiting status text is shown once in the emphasized headline; it is not duplicated immediately below.

**Why this priority**: Screenshot shows the same phrase twice, adding clutter.

**Acceptance Scenarios**:

1. **Given** waiting creator view, **When** reading the top chrome, **Then** “Waiting for opponent” (or localized) appears once as the headline.

### Edge Cases

- Join path (seat 1 arriving): Join CTA may share a row with New match; still not three stacked full-width bricks.
- Narrow screens: row may wrap once; still denser than three full-height stacked buttons.
- Finished/rematch: rematch actions may stay wrapped row; do not regress waiting density.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Waiting creator actions MUST place Share and New match on one horizontal row.
- **FR-002**: Debug/Pages link MUST NOT use a full-width stacked button equal in height to Share.
- **FR-003**: Waiting status copy MUST appear once (no duplicate muted line that repeats the headline).
- **FR-004**: Primary CTA styling MUST follow Expressive contract (emphasized shape + spring) without thick bottom-ledge “brick” elevation.
- **FR-005**: Waiting chrome MUST keep enough viewport for the board to enter the first screen on phone-width.
- **FR-006**: Telegram share (`switchInlineQuery`), leave, poll, and session rules-hide (004) MUST remain unchanged in behavior.

## Success Criteria *(mandatory)*

- **SC-001**: On phone-width waiting, stacked full-width CTA count above the board is ≤1 row of actions (plus optional compact debug link).
- **SC-002**: Board grid is at least partially visible without scrolling past waiting actions.
- **SC-003**: Reviewer using 002 Expressive checklist marks primary as Expressive (asymmetric/emphasized + spring), not “custom 3D brick.”
- **SC-004**: Waiting headline string appears once in the waiting chrome.

## Assumptions

- Debug link stays available for support but demoted (003 already demoted Pages URL).
- No MUI dependency (constitution / 002 research R1).
- Fonts Outfit / Source Sans 3 already loaded remain the display/body pair.
