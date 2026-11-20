---
description: "Tasks for Waiting Expressive chrome"
---

# Tasks: Waiting chrome density + Expressive fidelity

**Input**: `/specs/005-waiting-expressive-chrome/`

## Phase 1: Setup

- [x] T001 Confirm branch + docs under `specs/005-waiting-expressive-chrome/`

## Phase 2: Foundational

- [x] T002 [P] Retune primary Expressive elevation in `src/theme/expressive.css` (drop ledge; soft tonal + emphasized radius)
- [x] T003 [P] Add compact / link button utilities in `src/theme/expressive.css` for waiting density

## Phase 3: US1 + US3 — Compact waiting (P1/P2)

- [x] T004 [US1] Reflow waiting actions in `src/components/GamePanel.tsx` to one row (Share + New match)
- [x] T005 [US1] Demote debug copy-link to compact link control
- [x] T006 [US3] Remove duplicate muted waitingOpponent under actions

## Phase 4: US2 — Expressive fidelity (P1)

- [x] T007 [US2] Emphasized surfaces + tighter waiting gaps for FR-005
- [x] T008 `npm run build` green
- [ ] T009 Manual quickstart (human after Pages)

## Dependencies

Setup → Foundational → US1/US3 ∥ US2 polish → verify

## MVP

T002–T006.
