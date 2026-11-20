# Implementation Plan: Card slot Open target

**Branch**: `cursor/card-slot-open-3515` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

## Summary

Add `preferredOpenSessionId`; on card refresh re-apply Open+Drop keyboard with that session’s `web_app` URL. Extend notify transport edits to pass `reply_markup`.

## Technical Context

**Language/Version**: TypeScript / Telegraf  

**Primary Dependencies**: `notify.ts`, `cards.ts`, `bot.ts`, `miniAppUrl.ts`  

**Storage**: None  

**Testing**: unit for preference helper; `npm test`; Cloud Run redeploy  

**Constraints**: Constitution I–II Telegram; VIII minimum

## Constitution Check

| Principle | Response | Status |
|-----------|----------|--------|
| I–II | Card Open stays web_app | Pass |
| III–VII | Unchanged | Pass |
| VIII | Spec 014 only | Pass |

## Project Structure

```text
specs/014-card-slot-open/
src/telegram/cards.ts          # preferredOpenSessionId
src/telegram/notify.ts         # refresh with keyboard
src/telegram/bot.ts            # transport edit + markup
tests/unit/telegram/preferredOpenSessionId.test.ts
```

## Complexity Tracking

> None.
