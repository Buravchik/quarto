---
description: "Task list for Quarto classic Telegram 1v1"
---

# Tasks: Quarto classic Telegram 1v1

**Input**: Design documents from `/specs/001-classic-telegram-1v1/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (openapi.yaml, miniapp-api.md, bot-notifications.md), quickstart.md

**Tests**: Included — plan/quickstart require Vitest unit (`src/quarto`) and contract tests (initData, seat isolation, slot cap).

**Organization**: Phases by user story (P1 → P2 → P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no incomplete deps)
- **[Story]**: [US1] / [US2] / [US3]
- Paths relative to repo root `C:\Users\PC\Documents\Projects\quarto`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold repo per plan.md

- [ ] T001 Create directory layout `app/`, `public/`, `src/quarto/`, `src/quarto/modules/`, `src/telegram/`, `src/telegram/api/`, `src/components/`, `src/i18n/`, `tests/unit/quarto/`, `tests/contract/api/` per plan.md
- [ ] T002 Initialize TypeScript Node 22 project with Next.js (static export), React, Telegraf, Zod, Drizzle ORM + `pg` against Supabase `DATABASE_URL`, Vitest in `package.json`
- [ ] T003 [P] Add ESLint/Prettier (or repo-standard lint) config at repo root
- [ ] T004 [P] Add `.env.example` with `BOT_TOKEN`, `TELEGRAM_WEBAPP_URL`, `DATABASE_URL` (Supabase) and gitignore secrets
- [ ] T005 [P] Add `Dockerfile` for bot/API (Node 22) and GitHub Pages/static Mini App build scripts in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infra before any user story

**⚠️ CRITICAL**: Blocks US1–US3

- [ ] T006 Create Supabase/Postgres schema + migrations for `PlayerIdentity`, `ChallengeCard`, `MatchSession` (cite `data-model.md`: `ChallengeCard.surface` enum `group|dm`; `ChallengeCard.slots` max 8; `MatchSession.modules`; `MatchSession.missMode` / `pieRule` / `settingsLocked`; opaque `board` occupancy) under `src/telegram/` or `db/migrations/`
- [ ] T007 [P] Implement Telegram `initData` HMAC validation in `src/telegram/initData.ts`
- [ ] T008 [P] Implement HTTP router skeleton `/api/v1` + rate-limit middleware in `src/telegram/api/`
- [ ] T009 Define `GameModule` registry interface (traits, PieceSet, BoardLayout, win masks, pick model) and register stub `classic4` in `src/quarto/modules/`
- [ ] T010 Implement pure classic engine shell (phases, intents types, no Telegram) in `src/quarto/engine.ts`, `src/quarto/types.ts`
- [ ] T011 [P] RU/EN string tables scaffold in `src/i18n/`
- [ ] T012 Wire Telegraf bot entry + env loading in `src/telegram/bot.ts` (polling local / webhook prod hook)

**Checkpoint**: DB + auth + engine shell + bot process boot — stories can start

---

## Phase 3: User Story 1 — Challenge card to classic match (Priority: P1) 🎯 MVP

**Goal**: Group/DM challenge card, ≤8 slots, join 1v1, play classic give/place/declare, persist resume, draw on full board

**Independent Test**: quickstart A + B (+ F slot cap create path); two accounts finish a classic win; illegal declare rejected

### Tests for User Story 1

- [ ] T013 [P] [US1] Unit tests classic lines/win/draw/illegal declare in `tests/unit/quarto/classic.test.ts`
- [ ] T014 [P] [US1] Contract tests initData 401 + seat isolation for intents in `tests/contract/api/auth_intent.test.ts`
- [ ] T015 [P] [US1] Contract test slot cap `409 slot_cap` in `tests/contract/api/slot_cap.test.ts` (cite `data-model.md` `ChallengeCard.slots` max 8)

### Implementation for User Story 1

- [ ] T016 [P] [US1] Implement `classic4` BoardLayout + PieceSet + win lines in `src/quarto/modules/classic4.ts` (cite module-owned `traitCount`/`pieceCount`/`cellCount` in `data-model.md` PieceSet + BoardLayout)
- [ ] T017 [US1] Implement give/place/declare/draw transitions in `src/quarto/engine.ts` + `src/quarto/lines.ts` (FR-001–005, FR-020)
- [ ] T018 [US1] Persist/load `MatchSession` snapshots via Supabase in `src/telegram/sessions.ts` (cite `data-model.md` `MatchSession.board`, `pool`, `pieceInHand`, `phase`, `status`)
- [ ] T019 [US1] Card create/format/edit for `surface` `group|dm` in `src/telegram/cards.ts` (cite `data-model.md` `ChallengeCard.surface`, `chatId`, `messageId`)
- [ ] T020 [US1] API: `POST /cards`, `GET /cards/:cardId`, `POST /cards/:cardId/slots`, `POST /sessions/:sessionId/join`, `POST /sessions/:sessionId/intent` per `contracts/openapi.yaml` in `src/telegram/api/`
- [ ] T021 [US1] Mini App board UI: pool, hand, place, declare in `src/components/` + `app/`
- [ ] T022 [US1] Bot commands to create card in group vs DM; always edit card status on join/end in `src/telegram/bot.ts` + `src/telegram/cards.ts`
- [ ] T023 [US1] Notifications `opponent_joined` / `match_ended` + card edit per `contracts/bot-notifications.md` in `src/telegram/`

**Checkpoint**: Classic 1v1 MVP playable end-to-end

---

## Phase 4: User Story 2 — Miss and Pie Rule before play (Priority: P2)

**Goal**: Creator sets Miss/Pie before join; lock on join; Void/Persistent + Pie transitions in engine

**Independent Test**: quickstart C + D; settings 403 after lock

### Tests for User Story 2

- [ ] T024 [P] [US2] Unit tests Void/Persistent declare windows in `tests/unit/quarto/miss.test.ts`
- [ ] T025 [P] [US2] Unit tests Pie take/pass after first place in `tests/unit/quarto/pie.test.ts`
- [ ] T026 [P] [US2] Contract test settings lock on join in `tests/contract/api/settings.test.ts` (cite `data-model.md` `MatchSession.settingsLocked`, `missMode`, `pieRule`)

### Implementation for User Story 2

- [ ] T027 [P] [US2] Implement Miss Void/Persistent rules in `src/quarto/miss.ts` wired into engine
- [ ] T028 [P] [US2] Implement Pie Rule phase in `src/quarto/pie.ts` wired into engine
- [ ] T029 [US2] API `POST /sessions/:sessionId/settings` + lock on join in `src/telegram/api/` (openapi)
- [ ] T030 [US2] Mini App Miss/Pie checkboxes (creator only, disabled when locked) in `src/components/`
- [ ] T031 [US2] Persist `missMode`/`pieRule`/`voidedSets` and expose `pie_choice` intent (cite `data-model.md` `MatchSession.missMode`, `pieRule`, `voidedSets`)

**Checkpoint**: US1 + Miss/Pie session flags work

---

## Phase 5: User Story 3 — Turns, stall, rematch, achievements (Priority: P3)

**Goal**: Turn DMs + card updates; resign; 24h claim timeout; rematch; six achievements + ≤2 pins on card

**Independent Test**: quickstart E + F rematch + G

### Tests for User Story 3

- [ ] T032 [P] [US3] Unit/contract timeout claim gating in `tests/unit/quarto/timeout.test.ts` and/or `tests/contract/api/timeout.test.ts` (cite `data-model.md` `MatchSession.turnNotifiedAt`)
- [ ] T033 [P] [US3] Contract rematch offer/accept in `tests/contract/api/rematch.test.ts`
- [ ] T034 [P] [US3] Contract achievements pin max 2 in `tests/contract/api/achievements.test.ts` (cite `data-model.md` `PlayerIdentity.pinnedAchievementIds` max 2; `AchievementDef` ids)

### Implementation for User Story 3

- [ ] T035 [US3] Emit `your_turn` / `timeout_available`; set `turnNotifiedAt` on turn change; card edit always in `src/telegram/` (bot-notifications.md)
- [ ] T036 [US3] Intents `resign` + `claim_timeout` in engine + API (FR-014)
- [ ] T037 [US3] API rematch offer/accept/decline + new session on same card in `src/telegram/api/` (cite `data-model.md` `MatchSession.rematchOfSessionId`)
- [ ] T038 [US3] Achievement unlock predicates + `GET/POST /me/achievements` (+ pin) in `src/telegram/` and Mini App (FR-016)
- [ ] T039 [US3] Show up to two pinned achievement icons by name on card message in `src/telegram/cards.ts`
- [ ] T040 [US3] Rematch UI + claim-timeout control in Mini App `src/components/`

**Checkpoint**: Full v1 loop per spec

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: i18n, modules hook readiness, deploy validation

- [ ] T041 [P] Complete RU/EN coverage for bot + Mini App strings in `src/i18n/`
- [ ] T042 [P] Document `GameModule` plug-in stub usage in `src/quarto/modules/README.md` (FR-019; no catalog modes)
- [ ] T043 Rate-limit tuning + seat ownership audits on all mutating routes in `src/telegram/api/`
- [ ] T044 Static export Mini App + Pages deploy workflow; webhook Docker path verified
- [ ] T045 Run `quickstart.md` scenarios A–G against two test accounts; fix gaps
- [ ] T046 [P] Ensure OpenAPI `contracts/openapi.yaml` matches implemented handlers

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)** → **Foundational (2)** → **US1 (3)** → **US2 (4)** → **US3 (5)** → **Polish (6)**
- US2/US3 may start after Foundational only if staffing parallelizes; recommended order P1→P2→P3

### User Story Dependencies

- **US1**: After Phase 2 only
- **US2**: Needs US1 session/card/API skeleton (settings + miss/pie on same session)
- **US3**: Needs US1 match lifecycle; builds on notifications from US1

### Parallel Opportunities

- T003–T005; T007–T008; T011
- Within US1: T013–T015; T016 parallel to early tests
- Within US2: T024–T026; T027–T028
- Within US3: T032–T034
- Polish: T041, T042, T046

---

## Parallel Example: User Story 1

```bash
# Tests in parallel:
Task: T013 tests/unit/quarto/classic.test.ts
Task: T014 tests/contract/api/auth_intent.test.ts
Task: T015 tests/contract/api/slot_cap.test.ts
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1–2
2. Phase 3 US1
3. Stop — validate quickstart A/B/F(cap)
4. Demo classic match on Telegram

### Incremental Delivery

1. US1 classic card+match
2. US2 Miss/Pie
3. US3 turns/timeout/rematch/achievements
4. Polish + quickstart A–G

---

## Notes

- Cite `data-model.md` constraints in implementing tasks (do not restate enums here)
- v1 module = `classic4` only; board/pieces parameterized for later packs
- Card message always updated; DM pings additional
- Commit after each task or small group
