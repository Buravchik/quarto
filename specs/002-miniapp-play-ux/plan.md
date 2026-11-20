# Implementation Plan: Mini App play UX

**Branch**: `cursor/002-miniapp-play-ux-3515` (feature id `002-miniapp-play-ux`) | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-miniapp-play-ux/spec.md`

## Summary

Replace opaque piece ids and crude chrome with (1) a **module-aware trait-channel piece renderer** that keeps classic Quarto readable and stays extensible for future packs, and (2) a **Material 3 Expressive** Mini App shell (tokens, shapes, spring motion) without waiting on MUI Expressive. Classic rules, intents, and API contracts from 001 stay unchanged — presentation and interaction clarity only.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22; React 19  

**Primary Dependencies**: Next.js 15 static Mini App (existing); CSS design tokens + SVG for Expressive/pieces; optional tiny spring helper only if CSS springs insufficient — **no MUI required**  

**Storage**: N/A for this feature (no schema changes; Supabase/session model from 001 unchanged)  

**Testing**: Vitest unit (trait channels, play-surface derivation, PieceToken attributes); existing engine/contract/smoke suites must stay green; Telegram manual check for Expressive motion  

**Target Platform**: Telegram Mini App (GitHub Pages `/quarto`); bot/API unchanged on Cloud Run  

**Project Type**: Telegram game — static Mini App presentation layer over existing server-authoritative API  

**Performance Goals**: Piece grid remains snappy on mid-range phones; no layout thrash on give/place; motion ≤ ~400ms for emphasized springs  

**Constraints**: No new game modes; no client-authoritative rules; secrets stay out of bundle; trait identity not color-only; `prefers-reduced-motion`; light/dark Telegram chrome readability  

**Scale/Scope**: One classic board UI + lobby/waiting restyle; classic4 channel map first; Expressive theme shared across HomeLobby, GamePanel, AchievementsPanel  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Plan response | Status |
|-----------|---------------|--------|
| I–II Telegram game/platform | Presentation only inside existing Mini App + bot shell | Pass |
| III Secrets out of repo | No new secrets; theme/tokens are public CSS | Pass |
| IV Do not trust the client | Intents still server-validated; UI only displays snapshot | Pass |
| V Rate limits & isolation | Unchanged API; no new mutating surface | Pass |
| VI Rules in state machine | Engine untouched; channels map *bits → art*, not win logic | Pass |
| VII Store little | No new persisted entities | Pass |
| VIII Approved minimum | Spec 002 only: readable pieces + Expressive chrome; no catalog modes | Pass |

**Post-design re-check**: Contracts are UI/presentation only; 001 OpenAPI unchanged. Pass.

## Project Structure

### Documentation (this feature)

```text
specs/002-miniapp-play-ux/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 (UI contracts)
└── tasks.md             # /speckit-tasks (not this command)
```

### Source Code (repository root)

```text
app/                              # Next Mini App shell — apply Expressive theme root
src/
  theme/                          # NEW: expressive tokens, schemes, motion helpers
  pieces/                         # NEW: TraitChannel types, classic4 map, PieceToken SVG
  play/                           # NEW: derivePlaySurfaceState (viewer prompt)
  components/
    Board.tsx                     # Use PieceToken; empty cells distinct
    Pool.tsx                      # Use PieceToken; selection spring
    GamePanel.tsx                 # Expressive chrome + action copy from play surface
    HomeLobby.tsx                 # Expressive lobby + piece preview
    AchievementsPanel.tsx         # Light Expressive restyle
    Settings.tsx                  # Expressive controls
  quarto/modules/                 # Unchanged rules; optional UI channel registry adjacent
  i18n/                           # Expand give/place/wait/pie/declare/finished strings
tests/
  unit/pieces/                    # Channel decode + PieceToken attributes
  unit/play/                      # PlaySurfaceState derivation
  unit/quarto/                    # Existing — must stay green
  contract/api/                   # Existing — unchanged
```

**Structure Decision**: Keep Sudoku-like `app/` + `src/components` layout; add `src/theme`, `src/pieces`, `src/play` for presentation concerns. Do not introduce MUI or a parallel design-system package. Engine remains in `src/quarto`.

## Complexity Tracking

> No constitution violations requiring justification.
