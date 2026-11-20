---
description: "Tasks for Telegram play-loop hardening"
---

# Tasks: Telegram play-loop hardening

**Input**: `/specs/003-telegram-loop-harden/`  
**Tests**: Included (smoke fix + keep 001 suites).

## Phase 1: Setup

- [x] T001 Confirm branch `cursor/telegram-loop-harden-3515` and feature docs present under `specs/003-telegram-loop-harden/`

## Phase 2: Foundational

- [x] T002 Centralize `miniAppUrl` export from `src/telegram/miniAppUrl.ts` (or export from bot helper module usable by notify)
- [x] T003 On Cloud Run boot with `WEBHOOK_URL`, call `setWebhook` + allowed updates in `src/telegram/bot.ts`

## Phase 3: US1 — Live poll (P1)

- [x] T004 [US1] Add session poll (interval + visibility) in `src/components/GamePanel.tsx`
- [x] T005 [P] [US1] Document poll interval in quickstart; no engine changes

## Phase 4: US2 — Card-aligned lobby / share (P1)

- [x] T006 [US2] After lobby `POST /cards`, trigger bot DM/card with `web_app` for session (API hook or dedicated notify) — `src/telegram/` + `HomeLobby.tsx` as needed
- [x] T007 [US2] Waiting share: primary Telegram-native; demote Pages URL in `GamePanel.tsx`
- [x] T008 [US2] `/start` adds `web_app` Open Mini App in `src/telegram/bot.ts`

## Phase 5: US3 — Notification web_app (P2)

- [x] T009 [US3] Extend `src/telegram/notify.ts` DMs with `web_app` + sessionId
- [x] T010 [P] [US3] Localize notify copy when language known

## Phase 6: US4 — Smoke & polish (P2)

- [x] T011 [US4] Fix `scripts/smoke-prod.mjs` turnSeat-aware give→place
- [x] T012 Run `npm test` + `npm run test:contract`; mark green
- [x] T013 Deploy Cloud Run `quarto-bot`; verify webhook; merge PR

## Dependencies

Setup → Foundational → US1 ∥ US2 ∥ US3 → US4 deploy

## MVP

US1 + US2 + T003/T011 minimum for “loop not lying”.
