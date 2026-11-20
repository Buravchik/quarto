# Feature Specification: Waiting one-row chrome

**Feature Branch**: `cursor/waiting-one-row-3515` (feature id `012-waiting-one-row`)

**Created**: 2026-11-20

**Status**: Clarified (ready for plan)

**Input**: Waiting status (“Waiting for opponent…”) and Share / New-match icon actions should fit one horizontal row instead of status pill + actions underneath. Follow-up to 007/011 density feedback.

## Clarifications (encoded 2026-11-20)

- **Q1 — Layout**: One horizontal band: status headline + Share + New match in the **same** waiting surface. Not a second action row below.
- **Q2 — Join path**: Join + New match use the same one-row pattern for density consistency.
- **Q3 — Debug copy**: Stays a small corner icon on that surface (007); does not become a fourth large action in the primary strip.
- **Q4 — Behavior**: Share / leave / join / copy behaviors unchanged; presentation-only.
- **Q5 — New-match icon**: Replay (011), not plus/add.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Creator waiting on one row (Priority: P1)

While waiting for an opponent, the creator sees status text and Share + New match icons on a single horizontal row inside waiting chrome.

**Why this priority**: Removes wasted vertical stack; matches user feedback that the strip “can be one line.”

**Independent Test**: Open waiting as seat0; confirm one horizontal band; Share and New match still work.

**Acceptance Scenarios**:

1. **Given** creator waiting, **When** viewing waiting chrome, **Then** headline and Share/New-match icons share one row (no dedicated actions row below the status pill).
2. **Given** those icons, **When** activated, **Then** Share and New match behaviors match pre-012.

---

### User Story 2 - Join path density (Priority: P2)

Guest join chrome uses the same one-row pattern (Join + New match with status).

**Why this priority**: Consistency with creator waiting; less critical than seat0 wait.

**Independent Test**: Open waiting as non-seated guest with join affordance.

**Acceptance Scenarios**:

1. **Given** join expected, **When** viewing chrome, **Then** status + Join (+ New match if present) are one row.

---

### Edge Cases

- Narrow Mini App width: icons remain tappable; headline may truncate/ellipsis rather than wrapping actions under status as a second band.
- Debug corner must not collide with Share/New-match hit targets.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Creator waiting chrome MUST place status headline and Share / New-match icons in one horizontal band within the waiting surface.
- **FR-002**: Join waiting chrome MUST use the same one-row pattern for Join / New match.
- **FR-003**: Debug copy MUST remain a small corner control on the waiting surface.
- **FR-004**: Action behaviors (Share, leave/new match, join, copy) MUST remain unchanged.
- **FR-005**: New-match control MUST use the replay icon (not plus).

### Out of Scope

- Engine, API, session rules, board/pool layout.
- Changing copy strings beyond layout.

## Success Criteria *(mandatory)*

- **SC-001**: On phone-width waiting view, status + primary waiting actions occupy one visual row.
- **SC-002**: No regression in Share / New match / Join / debug copy activation.
- **SC-003**: Spec Kit artifacts for 012 present (spec, plan, tasks, checklist); constitution VIII presentation-only.

## Assumptions

- User affirmation “можно в одну строку” means same-surface horizontal band (Q1=A), not merely tighter gap between two stacked rows.
