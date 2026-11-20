# Quickstart validation: 002-miniapp-play-ux

Prove readable pieces + Expressive chrome without changing classic rules. Builds on [001 quickstart](../001-classic-telegram-1v1/quickstart.md).

## Prerequisites

- Node 22+, existing `.env` (`BOT_TOKEN`, `TELEGRAM_WEBAPP_URL`, `DATABASE_URL`, `NEXT_PUBLIC_API_BASE`)
- Spec: [spec.md](./spec.md), [data-model.md](./data-model.md), [contracts/](./contracts/)
- 001 engine/contract suite still applicable

## Setup (after implement)

```bash
cd <repo-root>
npm install
npm test                 # unit: engine + new pieces/play tests
npm run test:contract    # 001 API contracts unchanged
npm run smoke:miniapp    # lobby shell still loads under /quarto
npm run dev              # Mini App local; or deploy Pages as usual
```

## Scenario A — Trait readability (SC-001)

1. Open an active session (or lobby piece preview).
2. Pick a random pool piece; name all four traits without reading `p*`.
3. **Expect**: SVG channels match classic4 map in [data-model](./data-model.md); `data-channel-*` attributes present in DOM for tests.

## Scenario B — Give → place prompts (SC-002)

1. Two seats; seat 0 to give.
2. **Expect**: seat 0 headline = give; seat 1 = wait; only give controls primary.
3. After give: placer sees place + hand emphasis; giver sees wait.
4. **Expect**: no simultaneous Give+Place primary CTAs ([play-surface](./contracts/play-surface.md)).

## Scenario C — Expressive first open (SC-003 / SC-007)

1. Open Mini App with no `sessionId` inside Telegram.
2. **Expect**: Expressive lobby (brand, tagline, rules, Start, piece preview) — not “open a card” stub only.
3. Tap Start: perceptible spring/emphasis unless reduced motion.

## Scenario D — Empty / hand / declare

1. Empty cells clearly empty (no fake pieces).
2. Hand piece distinct from pool.
3. Declare selection marks cells without hiding traits.

## Scenario E — Regression (SC-004)

1. `npm test` + `npm run test:contract` green.
2. Illegal declare / join / rematch / slot cap still behave as 001.
3. Pie / Miss settings lock unchanged.

## Scenario F — Light / reduced motion

1. Force light scheme (or Telegram light): pieces and CTAs remain readable.
2. `prefers-reduced-motion: reduce`: no large overshoot; prompts still clear.

## Automated gate (minimum)

| Check | Command / assertion |
|-------|---------------------|
| Channel decode | Vitest: bitmask → four channels for all 16 classic pieces |
| PlaySurfaceState | Vitest: give/place/wait/pie/finished tables |
| PieceToken attrs | RTL: `data-channel-*` on rendered token |
| Engine + API | Existing vitest suites |
| Pages shell | `npm run smoke:miniapp` |
