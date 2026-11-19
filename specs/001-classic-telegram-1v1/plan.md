# Implementation Plan: Quarto classic Telegram 1v1

**Branch**: `001-classic-telegram-1v1` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-classic-telegram-1v1/spec.md`

## Summary

Ship classic Quarto (4×4 give-and-place) as a Telegram challenge-card + Mini App 1v1 product with Miss/Pie session flags, bot turn notifications, claimable 24h timeout, rematch, six achievements, and a modular hook for later rule packs. Architecture mirrors the Sudoku Telegram split (bot HTTP + static Mini App) but **game transitions are server-side** in a pure state machine (constitution VI), not client-decided.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22  

**Primary Dependencies**: Next.js (static Mini App export), React, Telegraf (bot), Zod (request validation), Drizzle ORM + `pg` against Supabase Postgres  

**Storage**: Supabase Free — hosted Postgres for cards/sessions/achievements/timers (connection via `DATABASE_URL`; secrets in env only)  

**Testing**: Vitest (unit: `src/quarto` state machine; contract: HTTP handlers with mocked initData)  

**Target Platform**: Telegram Bot API + Telegram Mini App; bot/API on **Cloud Run**; Mini App on **GitHub Pages** (Sudoku host pattern; no tunnels)  

**Project Type**: Telegram game — bot/API service + static Mini App frontend  

**Performance Goals**: Move/API p95 < 500ms under casual load; card status refresh acceptable within 1–2s after opponent action  

**Constraints**: Secrets only in env; validate Telegram `initData` on every Mini App write; rate-limit mutating endpoints; store minimal PII (Telegram user id + display name snapshot); no AI opponent; max 8 slots/card  

**Scale/Scope**: v1 classic only (~1 board UI, ~2 session checkboxes, card with ≤8 slots); later mode modules plug into `src/quarto` without rewriting Telegram shell  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Plan response | Status |
|-----------|---------------|--------|
| I–II Telegram game/platform | Bot + Mini App via official Telegram APIs | Pass |
| III Secrets out of repo | `BOT_TOKEN`, DB URL, signing secrets in env only | Pass |
| IV Do not trust client | All moves via authenticated API; server applies state machine | Pass |
| V Rate limits & isolation | Per-user rate limit; seat ownership checks on every mutation | Pass |
| VI Rules in state machine | `src/quarto` pure engine; Telegram only delivers events/UI | Pass |
| VII Store little | Persist card/session/achievements/timer only; no message body logs | Pass |
| VIII Approved minimum | Classic + Miss + Pie + card loop only; catalog modes not implemented | Pass |

**Post-design re-check**: Contracts keep game transitions off the client; Mini App sends intents only. Pass.

## Project Structure

### Documentation (this feature)

```text
specs/001-classic-telegram-1v1/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md                 # /speckit-tasks (not this command)
```

### Source Code (repository root)

```text
app/                         # Next.js App Router → static Mini App
public/
src/
  quarto/                    # Pure rules engine (classic + Miss + Pie + module hooks)
    engine.ts
    types.ts
    lines.ts
    miss.ts
    pie.ts
    modules/                 # GameModule registry; v1 = classic4; packs plug in later
  telegram/
    bot.ts                   # Telegraf: commands, card messages, notifications
    initData.ts              # HMAC validate WebApp initData
    api/                     # HTTP handlers mounted on bot server
    cards.ts                 # challenge card message formatting
  components/                # React board, piece pool, declare UI, settings
  i18n/                      # RU + EN strings
tests/
  unit/quarto/               # state machine without Telegram
  contract/api/              # authenticated intent contracts
```

**Structure Decision**: Follow Sudoku’s `app/` + `src/telegram` + domain folder split, renaming domain to `src/quarto`. Reject client-authoritative play used in Sudoku puzzles — Quarto multiplayer requires server authority.

## Complexity Tracking

> No constitution violations requiring justification.
