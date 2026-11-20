# Research: 002-miniapp-play-ux

## R1 — Material Expressive without waiting on MUI

- **Decision**: Deliver Material 3 Expressive look via **CSS design tokens + expressive shape scale + spring motion**, without adopting MUI as a required dependency for this feature. Keep plain React components (current stack has no `@mui/material`).
- **Rationale**: Spec FR-012/FR-013; user rejected current Georgia/raw-control look; MUI does not ship full Material Expressive parity. Adding MUI only for theming would grow bundle and still leave Expressive unfinished. Tokens + SVG/CSS shapes + spring CSS (or a tiny motion helper) match Spec Kit “approved minimum” and Telegram Mini App constraints.
- **Alternatives considered**:
  - Wait for / adopt MUI Expressive theme — rejected (blocks ship; no full Expressive in MUI today).
  - Add MUI + custom overrides — heavier than needed for static Mini App; deferred.
  - Copy Android Compose Expressive APIs literally — not applicable on web.

## R2 — Expressive token & motion baseline

- **Decision**: Introduce an Expressive theme module (`expressive` CSS variables + light/dark schemes) with: shape roles (corner radii including asymmetric “emphasized” containers), color roles seeded from existing teal/amber brand, elevation/surface roles, and spring motion presets (emphasized / standard / reduced). Honor `prefers-reduced-motion` and Telegram `colorScheme` when available.
- **Rationale**: M3 Expressive centers on shape morph + spring schemes + clear primary emphasis; CSS variables work with static Next export and Telegram WebView.
- **Alternatives considered**: Inline one-off styles per component — rejected (inconsistent); Framer Motion as hard dep — optional later if CSS springs prove insufficient; keep only for key interactions if added.

## R3 — Trait visual channels (extensible pieces)

- **Decision**: Define a **TraitChannel** presentation layer separate from engine bitmasks. classic4 maps its four bits to four orthogonal channels:

  | Bit (classic4) | Trait | Channel id | Visual encoding |
  |----------------|-------|------------|-----------------|
  | 0 | light / dark | `tone` | Fill luminance + optional rim (not the only cue for other traits) |
  | 1 | tall / short | `stature` | Token height band (short ~60% of tall) |
  | 2 | round / square | `plan` | Outline family (circle vs rounded-rect / square) |
  | 3 | solid / hollow | `aperture` | Closed fill vs centered cutout / ring |

  Piece renderer composes channels into one SVG token. Module supplies trait bits; UI supplies channel map for that module id. Future packs register additional channel maps without rewriting Board/Pool shells.
- **Rationale**: Spec FR-006/FR-010/FR-011/SC-006; tabletop Quarto readability; future alternate rules need multi-trait encoding that still reads at Mini App sizes.
- **Alternatives considered**:
  - Photoreal / 3D avatar-like meshes — rejected as primary (hard to extend traits; muddy at ~48px).
  - Color-only encoding — rejected (FR-006; a11y / small screens).
  - Hardcoded 16 unique SVGs with no channel model — rejected (blocks alternate rules).

## R4 — Piece rendering technology

- **Decision**: **Inline SVG React component** driven by channel props (one `PieceToken` used in pool, hand, board). Optional subtle depth (inner shadow / soft bevel) only if it does not obscure aperture/stature.
- **Rationale**: Crisp at phone sizes; no asset pipeline; easy unit-test of channel→SVG attributes; matches static Pages deploy.
- **Alternatives considered**: Canvas — overkill; PNG sprite sheet — inflexible for modules; emoji — illegible/inconsistent across clients.

## R5 — Turn / action clarity (presentation only)

- **Decision**: Derive a viewer-facing **PlaySurfaceState** on the client from existing session snapshot (phase, turnSeat, seats, hand, status, pie) — no new API fields. Map to RU/EN copy keys for: give, place, wait, pie choice, declare, finished. Primary CTA gets Expressive emphasis; inactive actions hidden or disabled with plain reason.
- **Rationale**: Spec FR-004/FR-005; constitution IV/VI unchanged — intents stay server-side.
- **Alternatives considered**: Server-computed “prompt” string — unnecessary coupling; client inventing phase — rejected.

## R6 — Scope of API / engine changes

- **Decision**: **No OpenAPI or engine rule changes** for 002. Optional small module metadata export for UI (e.g. `traitLabels` / channel map registration next to `classic4`) is presentation wiring, not rule logic. Existing session/intent contracts from 001 remain authoritative.
- **Rationale**: Spec FR-005; constitution VIII.
- **Alternatives considered**: Persist piece art in DB — rejected; change piece ids — rejected.

## R7 — Testing strategy for presentation

- **Decision**: Vitest unit tests for (1) classic4 trait→channel decoding, (2) PlaySurfaceState derivation, (3) reduced-motion / scheme helpers; React Testing Library smoke for PieceToken distinguishable attributes; keep existing engine/contract/smoke suites green. Manual/Telegram checklist for Expressive spring feel (SC-007).
- **Rationale**: Presentation bugs are easy to regress; full Playwright visual golden optional later.
- **Alternatives considered**: Screenshot-only CI — deferred; no unit tests — rejected given SC-001/SC-006.
