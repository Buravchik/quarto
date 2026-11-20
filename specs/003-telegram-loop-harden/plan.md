# Implementation Plan: Telegram play-loop hardening

**Branch**: `cursor/telegram-loop-harden-3515` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

## Summary

Close the Telegram product loop: poll match state while Mini App is open; lobby Start produces a bot card/`web_app` path; share and notifications are Telegram-native; webhook self-registers; prod smoke proves give→place for the actual turn seat. No classic rule changes.

## Technical Context

**Language/Version**: TypeScript 5 / Node 22 / React 19  

**Primary Dependencies**: Existing Telegraf, Next static Mini App, Vitest  

**Storage**: No schema change required (optional language on player already exists)  

**Testing**: Fix `scripts/smoke-prod.mjs`; unit for poll helper if any; 001 suites stay green  

**Target Platform**: Telegram Mini App + Cloud Run bot  

**Project Type**: Telegram game hardening  

**Performance Goals**: Poll ≤3s interval; negligible server load at casual concurrency  

**Constraints**: Server authority; `web_app` only; secrets in env  

**Scale/Scope**: Loop UX/ops only  

## Constitution Check

| Principle | Response | Status |
|-----------|----------|--------|
| I–II Telegram | Harden native Mini App/card/notify loop | Pass |
| III Secrets | Unchanged | Pass |
| IV–VI Authority | Poll reads server snapshot only | Pass |
| VII Store little | No new PII stores | Pass |
| VIII Minimum | Spec 003 only | Pass |

**Post-design**: Pass.

## Project Structure

```text
specs/003-telegram-loop-harden/
├── plan.md, research.md, data-model.md, quickstart.md, contracts/, tasks.md
src/components/GamePanel.tsx      # poll + share UX
src/components/HomeLobby.tsx      # after create → ensure Telegram card/DM
src/telegram/bot.ts               # setWebhook; /start web_app; miniAppUrl reuse
src/telegram/notify.ts            # web_app on DMs; language
scripts/smoke-prod.mjs            # turnSeat-aware give/place
```

## Complexity Tracking

> None.
