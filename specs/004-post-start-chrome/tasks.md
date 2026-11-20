---
description: "Tasks for Post-Start play chrome"
---

# Tasks: Post-Start play chrome

**Input**: `/specs/004-post-start-chrome/`  
**Tests**: Manual quickstart; `npm run build`. Engine suites unchanged.

## Phase 1: Setup

- [x] T001 Confirm branch `cursor/post-start-chrome-3515` and docs under `specs/004-post-start-chrome/`

## Phase 2: Foundational

- [x] T002 Encode clarifications in `specs/004-post-start-chrome/spec.md` (after Start = any open session)
- [x] T003 [P] Contract `contracts/play-chrome.md` + `data-model.md` surface table

## Phase 3: US1 — Start clears lobby chrome (P1) 🎯 MVP

**Goal**: After Start, no Session rules and no achievements under the session.

**Independent Test**: quickstart.md steps 3–4

- [x] T004 [US1] Ensure `src/components/GamePanel.tsx` does not render `Settings` (any status)
- [x] T005 [US1] Ensure `app/page.tsx` renders `AchievementsPanel` only when `sessionId` is absent
- [x] T006 [US1] Keep Session rules on `src/components/HomeLobby.tsx` before Start (FR-001)

## Phase 4: US2 — Rules language on lobby (P2)

**Goal**: RU/EN Session rules labels on home lobby.

- [x] T007 [P] [US2] Pass i18n labels into `src/components/Settings.tsx` from lobby copy
- [x] T008 [US2] Wire `sessionRules` / `missVoid` / `pieRule` / `settingsLocked` from `app/page.tsx` → `HomeLobby`

## Phase 5: Polish & verify

- [x] T009 `npm run build` green
- [ ] T010 Manual quickstart on live Pages after hard-refresh (human)
- [x] T011 Merge Spec Kit artifacts; mark feature Implemented / converge clean

## Dependencies

Setup → Foundational → US1 ∥ US2 → Polish

## MVP

US1 (T004–T006). US2 is label polish already in #13.

## Notes

- Application code for T004–T008 shipped in PR #13 ahead of Spec Kit; this feature **converges** process to that code. T010 remains human Telegram verify.
