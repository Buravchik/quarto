# Feature Specification: Human challenge card chrome

**Feature Branch**: `cursor/human-card-chrome-3515` (feature id `009-human-card-chrome`)

**Created**: 2026-11-20

**Status**: Implemented (awaiting Cloud Run T006)

**Input**: Continue product loop polish — challenge card text still reads like debug (`Surface: dm`, `waiting`, `turn seat 0`). Make card status human-readable in RU/EN with names.

## Clarifications (encoded 2026-11-20)

- **Drop debug lines**: No `Surface: dm|group|inline` on the card body players see.
- **No raw seat indices** in turn copy (`turn seat 0` → whose turn by **display name**).
- **Status words**: Localized waiting / in play / finished (not bare English enum only when language known).
- **Language**: Prefer card owner’s stored language; fallback EN.
- **Title**: Brand “Quarto” / “Кварто”; omit opaque card-id hex as a primary line (Open button carries session).
- **Scope**: Card message formatting (+ refresh paths already calling `formatCardMessage`); no engine changes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Card looks like a game invite (Priority: P1)

After Start / `/new`, the challenge card shows a clean title and a slot line with names and a human status — not Surface/debug fields.

**Acceptance Scenarios**:

1. **Given** a waiting slot with a named creator, **When** the card is posted/updated, **Then** text has no `Surface:` line and uses the creator’s display name.
2. **Given** an active match and it is Alice’s turn, **When** the card updates, **Then** turn copy names Alice (not `turn seat 0`).
3. **Given** owner language RU, **When** the card is formatted, **Then** status words are Russian.

## Requirements *(mandatory)*

- **FR-001**: Card body MUST NOT include `Surface:` debug field.
- **FR-002**: Active-turn wording MUST use the turn player’s display name when available.
- **FR-003**: Slot status MUST use localized human phrases for waiting / active / finished.
- **FR-004**: Card title MUST be brand Quarto (localized), not hex id as the hero line.

## Success Criteria *(mandatory)*

- **SC-001**: Screenshot of a new waiting card has no `Surface:` and no `turn seat N`.
- **SC-002**: RU owner gets RU status words on new/updated cards.
