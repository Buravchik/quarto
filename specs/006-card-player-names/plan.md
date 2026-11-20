# Implementation Plan: Challenge card player names

**Branch**: `cursor/card-player-names-3515` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

## Summary

Stop putting raw Telegram user ids on challenge cards. Derive a display label from Telegram user fields, persist via `ensurePlayer`, and use it in `seatLabel` / `formatCardMessage`. Touch name on Mini App create/join and bot `/new` / inline create. Redeploy Cloud Run bot.

## Technical Context

**Language/Version**: TypeScript / Telegraf / Drizzle  

**Storage**: Existing `players.display_name`  

**Testing**: Unit for label helper if cheap; manual card Start  

**Target**: Bot card DM + group `/new`  

## Constitution Check

| Principle | Response | Status |
|-----------|----------|--------|
| I–II Telegram | Card copy uses Telegram identity | Pass |
| III Secrets | No new secrets | Pass |
| IV–V | Names from validated initData / ctx.from | Pass |
| VII Store little | Only display name already in schema | Pass |
| VIII Minimum | Spec 006 only | Pass |

## Project Structure

```text
specs/006-card-player-names/
src/telegram/players.ts   # ensurePlayer refresh name; labelFromUser
src/telegram/cards.ts     # seatLabel uses displayName
src/telegram/api/handlers.ts
src/telegram/bot.ts
```
