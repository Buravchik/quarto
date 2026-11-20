# Contract: Material Expressive theme (UI)

**Scope**: Visual system for Mini App chrome. Not an HTTP API. Not dependent on MUI Expressive release.

## Theme root

App shell MUST set CSS variables (or equivalent) on a root element:

| Token role | Purpose |
|------------|---------|
| `--ex-surface` / `--ex-on-surface` | Page / panel backgrounds and text |
| `--ex-primary` / `--ex-on-primary` | Primary CTA (Start, Give, Place, Pie) |
| `--ex-secondary` | Amber/brand accent |
| `--ex-outline` | Borders / empty cell edges |
| `--ex-danger` | Errors / resign |
| `--ex-radius-sm..xl` | Shape scale |
| `--ex-radius-emphasized` | Asymmetric or larger radius for hero/CTA containers |
| `--ex-spring-emphasized` | Duration + easing (or spring params) for primary interactions |
| `--ex-spring-standard` | Default control feedback |

## Schemes

- `dark` (default atmospheric) and `light` MUST both keep piece channels legible.
- Prefer Telegram `themeParams` / `colorScheme` when present; never become illegible if Telegram shell is light.

## Motion

| Interaction | Expected |
|-------------|----------|
| Primary CTA press | Emphasized spring (scale/morph) unless reduced motion |
| Piece select | Standard spring / outline morph |
| Scheme change | Optional short fade; `disableTransitionOnChange`-style if flicker |

When `prefers-reduced-motion: reduce`: springs → short opacity/no overshoot; clarity unchanged.

## Component expectations

- Lobby, waiting, play, achievements share the same token set.
- Primary actions use `--ex-primary` + emphasized shape + soft tonal elevation; secondary actions quieter. Do **not** use thick bottom-ledge “3D brick” shadows (see 005).
- Raw browser default buttons and Georgia-as-only-type are out of contract for ship of 002 (brand may keep a display face, but Expressive shape/motion must dominate hierarchy).
