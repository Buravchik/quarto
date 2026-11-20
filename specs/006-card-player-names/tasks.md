---
description: "Tasks for card player names"
---

# Tasks: Challenge card player names

## Phase 1: Setup

- [x] T001 Spec docs under `specs/006-card-player-names/`

## Phase 2: Foundational

- [x] T002 Add Telegram display-name helper + refresh in `src/telegram/players.ts`
- [x] T003 [US1] `seatLabel` in `src/telegram/cards.ts` uses `displayName`

## Phase 3: Wire identity

- [x] T004 [US2] Mini App create/join in `src/telegram/api/handlers.ts` passes name from initData
- [x] T005 [US2] Bot `/new` + inline create in `src/telegram/bot.ts` pass `ctx.from` name
- [x] T006 createCard/addSlot accept optional displayName into ensurePlayer

## Phase 4: Verify

- [x] T007 `npm test` / build as applicable
- [ ] T008 Deploy Cloud Run bot; human card check
