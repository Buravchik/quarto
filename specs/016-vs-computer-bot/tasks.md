---
description: "Tasks for play vs computer"
---

# Tasks: Play vs computer (classic Quarto)

**Input**: Design documents from `/specs/016-vs-computer-bot/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

## Phase 1: Setup

- [x] T001 Add `src/quarto/computer/` folder skeleton: `types.ts` (`Difficulty`), empty `policy.ts` / `threats.ts` / `search.ts` exports
- [x] T002 [P] Add i18n keys for vs-computer / difficulty / opponent label in `src/i18n/en.ts` and `src/i18n/ru.ts`

## Phase 2: Foundational

- [x] T003 Migration + `db/schema.ts`: nullable `difficulty` on `sessions` (`easy|normal|hard|expert`); document `COMPUTER_USER_ID` in `src/telegram/computerSeat.ts` (`"computer"`)
- [x] T004 Extend `toSnapshot` / seat helpers in `src/telegram/sessions.ts` for `difficulty`, `opponentKind` (data-model Session.difficulty, Session.seat1)
- [x] T005 Implement `runComputerTurns(sessionId)` in `src/telegram/sessions.ts` (loop apply policy intents while turn is computer; persist; safety cap)
- [x] T006 Wire `runComputerTurns` after successful human intents + create/start + rematch in `src/telegram/api/handlers.ts`; reject `join` when seat1 is computer

## Phase 3: User Story 1 — Start and finish vs computer (P1) 🎯 MVP

- [x] T007 [US1] `createVsComputerSession` path: POST `/api/v1/cards` accepts `vsComputer` + `difficulty` per `contracts/vs-computer.md`; seat computer; `startMatch`; run computer if needed
- [x] T008 [US1] Home lobby UI: Play vs computer control + difficulty select in `src/components/HomeLobby.tsx` / `Settings.tsx`
- [x] T009 [US1] GamePanel / surface: show computer opponent label + difficulty; hide human join-wait chrome for computer sessions
- [x] T010 [US1] Unit: session create marks seat1 computer and starts active — covered via policy + create path (policy fixtures)

## Phase 4: User Story 2 — Smarter difficulty (P2)

- [x] T011 [P] [US2] `threats.ts`: immediate winning places; list safe vs unsafe gifts
- [x] T012 [US2] `policy.ts`: Easy/Normal/Hard chooseIntent (take win → Miss claim → safe give → Hard scoring)
- [x] T013 [US2] `search.ts`: Expert bounded search when empty ≤ 6; time/node budget
- [x] T014 [US2] Unit fixtures `tests/unit/quarto/computer-policy.test.ts`: Normal never gifts mate; Normal takes win; Expert returns under 5s on fixture

## Phase 5: User Story 3 — Rematch and rules parity (P3)

- [x] T015 [US3] Rematch carries `difficulty` and reseats computer (`sessions.ts` / handlers)
- [x] T016 [US3] Timeout claim UI/path skips when waiting on computer turn (`GamePanel` / timeout helpers)
- [x] T017 [US3] Pie: computer chooser always pass (`policy.ts`)

## Phase 6: Polish

- [x] T018 [P] README / `docs/modes.md` one-liner: vs-computer ≠ solitaire catalog mode
- [ ] T019 Mark tasks done; `npm test`; deploy bot + Pages; manual smoke A–G from quickstart.md
