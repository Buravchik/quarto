---
description: "Tasks for play vs computer"
---

# Tasks: Play vs computer (classic Quarto)

**Input**: Design documents from `/specs/016-vs-computer-bot/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Add `src/quarto/computer/` folder skeleton: `types.ts` (`Difficulty`), empty `policy.ts` / `threats.ts` / `search.ts` exports
- [ ] T002 [P] Add i18n keys for vs-computer / difficulty / opponent label in `src/i18n/en.ts` and `src/i18n/ru.ts`

## Phase 2: Foundational

- [ ] T003 Migration + `db/schema.ts`: nullable `difficulty` on `sessions` (`easy|normal|hard|expert`); document `COMPUTER_USER_ID` in `src/telegram/computerSeat.ts` (`"computer"`)
- [ ] T004 Extend `toSnapshot` / seat helpers in `src/telegram/sessions.ts` for `difficulty`, `opponentKind` (data-model Session.difficulty, Session.seat1)
- [ ] T005 Implement `runComputerTurns(sessionId)` in `src/telegram/sessions.ts` (loop apply policy intents while turn is computer; persist; safety cap)
- [ ] T006 Wire `runComputerTurns` after successful human intents + create/start + rematch in `src/telegram/api/handlers.ts`; reject `join` when seat1 is computer

**Checkpoint**: Foundation ready — can create a computer session that auto-plays random legal moves

## Phase 3: User Story 1 — Start and finish vs computer (P1) 🎯 MVP

**Goal**: One human starts Play vs computer and completes a classic match.  
**Independent Test**: Create vs-computer Normal; play; see outcome with computer opponent.

- [ ] T007 [US1] `createVsComputerSession` path: POST `/api/v1/cards` accepts `vsComputer` + `difficulty` per `contracts/vs-computer.md`; seat computer; `startMatch`; run computer if needed
- [ ] T008 [US1] Home lobby UI: Play vs computer control + difficulty select in `src/components/HomeLobby.tsx` / `Settings.tsx`
- [ ] T009 [US1] GamePanel / surface: show computer opponent label + difficulty; hide human join-wait chrome for computer sessions
- [ ] T010 [US1] Unit: session create marks seat1 computer and starts active (`tests/` or existing telegram session tests)

**Checkpoint**: MVP playable vs random/Normal stub policy

## Phase 4: User Story 2 — Smarter difficulty (P2)

**Goal**: Policy ladder Easy→Expert per research.md R3.  
**Independent Test**: Fixtures in quickstart (take-win, safe-give).

- [ ] T011 [P] [US2] `threats.ts`: immediate winning places; list safe vs unsafe gifts
- [ ] T012 [US2] `policy.ts`: Easy/Normal/Hard chooseIntent (take win → Miss claim → safe give → Hard scoring)
- [ ] T013 [US2] `search.ts`: Expert bounded search when empty ≤ 6; time/node budget
- [ ] T014 [US2] Unit fixtures `tests/computer-policy.test.ts`: Normal never gifts mate; Normal takes win; Expert returns under 5s on fixture

**Checkpoint**: SC-002/SC-003 covered by tests

## Phase 5: User Story 3 — Rematch and rules parity (P3)

**Goal**: Rematch/resign/timeout parity with computer.  
**Independent Test**: Rematch reseats computer; resign → computer win; no 8h claim vs computer turn.

- [ ] T015 [US3] Rematch carries `difficulty` and reseats computer (`sessions.ts` / handlers)
- [ ] T016 [US3] Timeout claim UI/path skips when waiting on computer turn (`GamePanel` / timeout helpers)
- [ ] T017 [US3] Pie: computer chooser always pass (`policy.ts`)

## Phase 6: Polish

- [ ] T018 [P] README / `docs/modes.md` one-liner: vs-computer ≠ solitaire catalog mode
- [ ] T019 Mark tasks done; `npm test`; deploy bot + Pages; manual smoke A–G from quickstart.md

## Dependencies

- Phase 1 → 2 → 3 (MVP) → 4 → 5 → 6  
- US2 policy can stub in US1 with Normal=safe-random then replace in T011–T014  
- T005 blocks meaningful US1 play

## Implementation strategy

1. Ship US1 with Normal policy minimum (take-win + safe-give) as soon as T007–T009 work.  
2. Harden US2 fixtures before Expert search polish.  
3. US3 rematch/timeout last.
