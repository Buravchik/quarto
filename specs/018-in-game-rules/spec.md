# Feature Specification: In-game rules button

**Feature Branch**: `cursor/018-in-game-rules-3515` (feature id `018-in-game-rules`)

**Created**: 2026-11-22

**Status**: Clarified (ready for plan/implement)

**Input**: Small rules affordance during play that stays out of the way but can be opened when confused.

## Clarifications (encoded 2026-11-22)

- **Q1 = B**: Classic how-to-play **plus** read-only current session toggles (Miss / Pie / declare hints).
- **Q2 = A**: Compact **?** icon → expandable panel under the header (no overlay).
- **E1**: Closed by default; small secondary chrome.
- **E2**: On `GamePanel` (in-session), not home lobby Settings editor.
- **E3**: RU + EN.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Peek rules mid-match (Priority: P1)

Player taps **?**, reads classic rules and this match’s Miss/Pie/hints, collapses again; board/hand state unchanged.

### User Story 2 - Stays quiet (Priority: P1)

With panel closed, only a small **?** control is visible next to the play header.

## Requirements *(mandatory)*

- **FR-001**: `GamePanel` MUST offer a closed-by-default **?** control that toggles an inline panel under the header.
- **FR-002**: Panel MUST include classic how-to-play copy (give → place → declare; four traits; line of four).
- **FR-003**: Panel MUST list this session’s Miss mode, Pie, and declare hints as read-only.
- **FR-004**: No engine/API/schema changes; no overlay modal.
- **FR-005**: Waiting one-row chrome MUST still fit — **?** is an icon button in the header actions cluster.

## Success Criteria *(mandatory)*

- **SC-001**: Closed state adds no rules wall above the board.
- **SC-002**: Open state shows both classic text and session toggles without leaving the match.
