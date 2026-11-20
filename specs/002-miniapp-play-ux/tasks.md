---
description: "Task list for Mini App play UX"
---

# Tasks: Mini App play UX

**Input**: Design documents from `/specs/002-miniapp-play-ux/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (piece-visual.md, play-surface.md, expressive-theme.md), quickstart.md

**Tests**: Included — research R7 + quickstart automated gate require Vitest for channels, PlaySurfaceState, PieceToken attrs; existing engine/contract/smoke must stay green.

**Organization**: Phases by user story. US1 and US3 are both P1; implement US1 (readable pieces) as MVP, then US3 (Expressive shell), then US2 (turn copy).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no incomplete deps)
- **[Story]**: [US1] / [US2] / [US3]
- Paths relative to repo root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Presentation folders for theme/pieces/play per plan.md (repo already exists)

- [ ] T001 Create directories `src/theme/`, `src/pieces/`, `src/play/`, `tests/unit/pieces/`, `tests/unit/play/` per plan.md Project Structure
- [ ] T002 [P] Confirm no MUI dependency added in `package.json` (Expressive via CSS tokens per research R1); document decision in a one-line comment in `src/theme/README.md` if useful

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared Expressive tokens + trait-channel types before any story UI

**⚠️ CRITICAL**: Blocks US1–US3

- [ ] T003 Implement `ExpressiveTheme` CSS variables and light/dark schemes in `src/theme/expressive.css` (cite `data-model.md` `ExpressiveTheme.scheme`, `colorRoles`, `shapeRoles`, `motionRoles`; contract `contracts/expressive-theme.md`)
- [ ] T004 [P] Implement scheme + reduced-motion helpers in `src/theme/motion.ts` and `src/theme/scheme.ts` (Telegram `colorScheme` + `prefers-reduced-motion`)
- [ ] T005 Define `TraitChannel` / `ModuleChannelMap` types and registry API in `src/pieces/types.ts` + `src/pieces/registry.ts` (cite `data-model.md` `TraitChannel.id`, `TraitChannel.bitIndex`, `ModuleChannelMap.moduleId`, `ModuleChannelMap.channels`)
- [ ] T006 Register classic4 channel map (tone/stature/plan/aperture ↔ bits 0–3) in `src/pieces/classic4Channels.ts` matching engine bitmasks in `src/quarto/modules/classic4.ts` (cite `data-model.md` classic4 bit table)
- [ ] T007 [P] Add RU/EN trait + action prompt string keys scaffold in `src/i18n/en.ts` and `src/i18n/ru.ts` (give/place/wait/pie/declare/finished + trait labels)
- [ ] T008 Wire theme root (import expressive CSS + apply scheme class) in `app/layout.tsx` and/or `app/page.tsx` without yet restyling all controls

**Checkpoint**: Tokens + channel registry available; stories can start

---

## Phase 3: User Story 1 — Readable classic board & pieces (Priority: P1) 🎯 MVP

**Goal**: Pool, board, and hand show trait-channel SVG tokens; empty cells distinct; no raw `p0` as sole identity

**Independent Test**: quickstart Scenario A + D; every pool/board piece identifiable by four traits; `data-channel-*` present

### Tests for User Story 1

- [ ] T009 [P] [US1] Unit tests: all 16 classic pieces decode to four channels in `tests/unit/pieces/classic4Channels.test.ts` (cite `data-model.md` classic4 bit table; `TraitChannel.bitIndex`)
- [ ] T010 [P] [US1] RTL test: `PieceToken` exposes `data-piece-id` + `data-channel-*` in `tests/unit/pieces/PieceToken.test.tsx` per `contracts/piece-visual.md`

### Implementation for User Story 1

- [ ] T011 [P] [US1] Implement `decodeChannels` / `getChannelMap` in `src/pieces/decode.ts` (cite `data-model.md` `PieceAppearance.pieceId`, `moduleId`, `channels`)
- [ ] T012 [US1] Implement SVG `PieceToken` in `src/pieces/PieceToken.tsx` with sizes/emphasis per `contracts/piece-visual.md` (cite `data-model.md` `PieceAppearance.size`, `PieceAppearance.emphasis`)
- [ ] T013 [US1] Replace raw ids in `src/components/Pool.tsx` with `PieceToken` (selection emphasis; aria-label from i18n traits)
- [ ] T014 [US1] Replace raw ids in `src/components/Board.tsx` with `PieceToken` on occupied cells; empty cells use distinct empty affordance (no fake piece)
- [ ] T015 [US1] Show hand `PieceToken` with `emphasis=inHand` in `src/components/GamePanel.tsx` when `pieceInHand` set
- [ ] T016 [US1] Pass active `moduleId` (default `classic4`) into Board/Pool/hand from session modules in `src/components/GamePanel.tsx`

**Checkpoint**: Classic match UI is readable Quarto without Expressive polish complete

---

## Phase 4: User Story 3 — Expressive shell (Priority: P1)

**Goal**: Lobby, waiting, and play chrome use Material 3 Expressive shapes/motion/hierarchy; piece preview on first open

**Independent Test**: quickstart Scenario C + F; composed lobby; spring on primary CTA unless reduced motion

### Tests for User Story 3

- [ ] T017 [P] [US3] Unit tests: scheme resolution + reduced-motion flag in `tests/unit/theme/scheme.test.ts` (cite `data-model.md` `ExpressiveTheme.scheme`)
- [ ] T018 [P] [US3] Extend `scripts/smoke-miniapp.mjs` (or unit) to assert lobby root carries Expressive theme class/vars after load

### Implementation for User Story 3

- [ ] T019 [P] [US3] Add shared Expressive control primitives (primary button, surface panel) in `src/theme/components.tsx` or `src/components/expressive/` using CSS vars from T003
- [ ] T020 [US3] Restyle `src/components/HomeLobby.tsx` — brand, tagline, rules, Start CTA, piece preview via decorative `PieceToken`s (FR-009)
- [ ] T021 [US3] Restyle waiting/share chrome and primary actions in `src/components/GamePanel.tsx` with Expressive emphasis + spring press (respect `src/theme/motion.ts`)
- [ ] T022 [US3] Light Expressive restyle of `src/components/Settings.tsx` and `src/components/AchievementsPanel.tsx`
- [ ] T023 [US3] Replace Georgia-only shell styling in `app/page.tsx` with Expressive typography/surfaces; keep brand teal/amber seeds
- [ ] T024 [US3] Ensure light scheme legibility for pieces + CTAs (toggle via Telegram scheme / helper)

**Checkpoint**: First open and in-match chrome feel Expressive; pieces from US1 still work

---

## Phase 5: User Story 2 — Clear turn & action state (Priority: P2)

**Goal**: Plain RU/EN prompts for give/place/wait/pie/declare/finished; primary CTA only for expected action

**Independent Test**: quickstart Scenario B; ≥95% correct give vs place on scripted glances

### Tests for User Story 2

- [ ] T025 [P] [US2] Unit table tests for `derivePlaySurfaceState` in `tests/unit/play/derivePlaySurfaceState.test.ts` covering give/place/wait/pie/finished/join (cite `data-model.md` `PlaySurfaceState.expectedAction`, `isMyTurn`, `primaryCta`; contract `contracts/play-surface.md`)

### Implementation for User Story 2

- [ ] T026 [US2] Implement `derivePlaySurfaceState` in `src/play/derivePlaySurfaceState.ts` (cite `data-model.md` `PlaySurfaceState` fields; normative mapping in `contracts/play-surface.md`)
- [ ] T027 [US2] Wire headlines + primary CTA enablement from PlaySurfaceState into `src/components/GamePanel.tsx` (hide inactive Give/Place/Pie as primary)
- [ ] T028 [US2] Complete RU/EN copy for all `headlineKey` / CTA keys in `src/i18n/en.ts` and `src/i18n/ru.ts`
- [ ] T029 [US2] Hand emphasis flag from PlaySurfaceState drives `PieceToken` `inHand` when viewer must place
- [ ] T030 [US2] Finished/waiting/join copy paths remain clear; creator never sees Join (`contracts/play-surface.md` invariants)

**Checkpoint**: US1+US3+US2 — readable pieces, Expressive chrome, clear turn language

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Regression and validation across stories

- [ ] T031 [P] Confirm `npm test` + `npm run test:contract` green (001 engine/API unchanged)
- [ ] T032 [P] Run `npm run smoke:miniapp` against Pages basePath `/quarto`
- [ ] T033 Walk quickstart Scenarios A–F; note gaps in PR description
- [ ] T034 [P] Remove leftover raw piece-id labels from play UI if any remain in `src/components/`
- [ ] T035 Update feature status in `specs/002-miniapp-play-ux/spec.md` / checklist notes only if needed after implement

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **BLOCKS** all stories
- **US1 (Phase 3)**: After Foundational — MVP
- **US3 (Phase 4)**: After Foundational; best after US1 so lobby preview reuses `PieceToken`
- **US2 (Phase 5)**: After Foundational; integrates with GamePanel from US1/US3
- **Polish (Phase 6)**: After desired stories

### User Story Dependencies

- **US1 (P1)**: Channel registry (T005–T006) only — no dependency on US2/US3
- **US3 (P1)**: Theme foundation (T003–T004, T008); piece preview prefers US1 `PieceToken`
- **US2 (P2)**: Can start after Foundational + i18n scaffold; needs GamePanel integration with US1 hand/board

### Parallel Opportunities

- T002 ∥ T001 after dirs exist
- T003 then T004 [P] with T005→T006; T007 [P] alongside
- US1 tests T009 ∥ T010; then T011 ∥ before T012
- US3 tests T017 ∥ T018; T019 parallelizable with copy work
- Polish T031 ∥ T032 ∥ T034

---

## Parallel Example: User Story 1

```bash
# Tests together:
Task: T009 classic4Channels.test.ts
Task: T010 PieceToken.test.tsx

# After decode:
Task: T011 decode.ts
Task: T012 PieceToken.tsx  # after T011
# Then Pool ∥ Board file edits carefully (different files):
Task: T013 Pool.tsx
Task: T014 Board.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup  
2. Phase 2 Foundational (theme + channels)  
3. Phase 3 US1 readable pieces  
4. **STOP** — validate quickstart A/D  
5. Deploy/demo if desired  

### Incremental Delivery

1. Setup + Foundational  
2. US1 → readable Quarto  
3. US3 → Expressive shell (user’s look requirement)  
4. US2 → turn/action clarity  
5. Polish + quickstart A–F  

### Suggested MVP scope

**US1 only** for rules-feel MVP; ship **US1+US3** before calling the look done (user rejected non-Expressive UI).

---

## Notes

- No OpenAPI/engine/DB tasks — presentation only (FR-005)
- Cite `data-model.md` fields in implementing tasks; do not restate full constraint tables
- Commit after each task or logical group
- Format: all tasks use `- [ ]`, TaskID, optional `[P]`, story label on US phases, file paths
