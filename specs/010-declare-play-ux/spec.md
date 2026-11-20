# Feature Specification: Declare play UX

**Feature Branch**: `cursor/declare-play-ux-3515` (feature id `010-declare-play-ux`)

**Created**: 2026-11-20

**Status**: Clarified (ready for plan/implement)

**Input**: Clear Quarto declare UX; avoid confusing place/declare taps; optional legal-line hints.

## Clarifications (encoded 2026-11-20)

- **Q1 = B + settings toggle**: When **Declare hints** is ON in match rules, highlight legal win-sets; tapping a hinted line selects all four cells. When OFF (default), no legal-line hints — player can still miss their win (part of the fun).
- **Q2 = A**: Declare UI appears only when the engine already allows declare (unchanged windows). No forced post-place declare prompt.
- **Selection chrome**: No raw cell-index list as primary feedback; board highlights + confirm Declare.
- **Rules authority**: Server still validates `declare`; hints are presentation only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Distinct declare selection (Priority: P1)

When declare is legal, the player sees a clear declare affordance, selects four cells on the board (highlights), and confirms without reading index numbers.

### User Story 2 - Optional legal-line hints (Priority: P1)

Creator can enable Declare hints in session rules before lock. With hints on, legal Quarto lines are highlighted and tappable as a whole set. With hints off, no such suggestions.

### User Story 3 - Place vs declare not confused (Priority: P2)

During place with piece in hand, empty-cell taps still place; declare selection does not steal place taps.

## Requirements *(mandatory)*

- **FR-001**: Declare selection MUST be visually distinct from placing.
- **FR-002**: Primary declare feedback MUST be board highlights, not raw cell indices.
- **FR-003**: Session setting **declareHints** (default **false**) MUST lock with Miss/Pie on join.
- **FR-004**: When declareHints is true and declare is legal, UI MUST highlight legal win-sets; tap selects the full set.
- **FR-005**: When declareHints is false, UI MUST NOT highlight legal win-sets as suggestions.
- **FR-006**: Declare timing/windows and server legality MUST remain unchanged (Q2=A).

## Success Criteria *(mandatory)*

- **SC-001**: With hints off, no legal-line suggestion chrome appears.
- **SC-002**: With hints on, tapping a suggested line fills four declare cells.
- **SC-003**: Engine/contract declare tests remain green.
