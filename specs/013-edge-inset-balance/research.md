# Research: Edge inset balance

## R1 — Why right feels flush

- **Decision**: Combine (a) Telegram `contentSafeArea` / CSS vars often asymmetric or zero on one side, (b) base `1.1rem` gutter only, (c) no `viewport-fit=cover`, (d) possible scrollbar eating trailing space.
- **Rationale**: `.ex-app` uses symmetric CSS padding today; user still sees left OK / right flush → insets + overflow, not a typo in left-only padding.

## R2 — Fix approach

- **Decision**: Pad `.ex-app` with `calc(base + env(safe-area-inset-*) + var(--tg-content-safe-area-inset-*, 0px))`; export Next viewport `viewportFit: "cover"`; `overflow-x: clip` on shell; slightly increase base horizontal gutter for touch.
- **Alternatives**: Pad only `padding-right` harder — rejected (fragile; would break when left inset grows).
