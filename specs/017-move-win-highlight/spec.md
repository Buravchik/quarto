# Feature Specification: Move + win highlight

**Feature Branch**: `cursor/017-move-win-highlight-3515` (feature id `017-move-win-highlight`)

**Created**: 2026-11-21

**Status**: Clarified (ready for plan/implement)

**Input**: Vs-computer last-move mark (turn-scoped); explicit Quarto win reveal (shared trait + cells); human games only after a correct declare.

## Existing declare model (baseline — already shipped)

Server windows (unchanged by this feature):

- **Persistent miss**: only the seat that just placed may `declare`, and only in `select_give` / `pie_choice`, and the set must include `lastPlacedCell`.
- **Void miss**: same placer window **or** the receiver may claim a void line through `lastPlacedCell` before placing (`voidClaimOpen`).
- False declare → reject, match continues.
- Hints (`declareHints`) are optional soft suggestions only; legality stays on the server.
- A finished Quarto win always stores `outcome.declaredSet` (the four cells). Resign / timeout / draw do **not**.

This feature **reuses** `declaredSet` / `lastPlacedCell` / `lastPlacerSeat`; it does not invent undeclared wins on the board.

## Clarifications (encoded 2026-11-22)

- **Q1 = A**: Vs-computer only — highlight the **cell** of the computer’s last place; keep it until the computer’s **next place** (or match end). Implementation: show when `lastPlacerSeat === computerSeat` and `lastPlacedCell != null`; human place clears it by updating `lastPlacerSeat`.
- **Q2 = A**: On win, list **all** shared attributes (existing RU/EN trait labels).
- **Q3 = A**: Explicit seat banner — “You won” / “Computer won” / “Opponent won”, plus trait(s) + cell highlights.
- **E1**: Human 1v1 Quarto chrome only when `outcome.type === "win"` and `declaredSet` present.
- **E2**: Vs-computer uses the same win reveal after bot declare.
- **E3**: Last-move mark is vs-computer only (not human 1v1).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See computer’s last place (Priority: P1)

In a vs-computer match, after the bot places, the human can tell which cell was just filled until the bot places again (or the match ends).

### User Story 2 - Explicit Quarto reveal (Priority: P1)

When a match ends by declare win, the UI states who won, lists all shared traits, and highlights the four `declaredSet` cells until leave / rematch.

### User Story 3 - No false win chrome in human play (Priority: P1)

Resign / timeout / draw show no Quarto line highlight. Only a validated declare lights the set.

## Requirements *(mandatory)*

- **FR-001**: Vs-computer MUST mark the computer’s last placed cell while that place remains the latest place by the computer; MUST clear when the human places (or match ends with win chrome taking over).
- **FR-002**: On `outcome.type === "win"` with `declaredSet`, UI MUST highlight those cells and show all shared trait labels and an explicit winner line (Q2/Q3).
- **FR-003**: Human matches MUST NOT show Quarto win chrome without `declaredSet`.
- **FR-004**: Shared-trait derivation MUST match engine `isQuartoSet` bit logic (shared presence or shared absence per trait).
- **FR-005**: Declare legality / miss windows MUST remain unchanged.
- **FR-006**: Snapshot MUST expose `lastPlacerSeat` so the Mini App can apply FR-001 without guessing.

## Success Criteria *(mandatory)*

- **SC-001**: After a computer place, the marked cell is obvious without reading logs.
- **SC-002**: After a declare win, player can name every shared trait from the banner alone.
- **SC-003**: Resign/timeout finished matches show no Quarto line highlight.
