# Implementation Plan: Play vs computer (classic Quarto)

**Branch**: `cursor/016-vs-computer-bot-3515` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

## Summary

Add classic 1v1 sessions where seat 1 is a **computer** opponent with difficulty Easy|Normal|Hard|Expert. Reuse the existing pure engine (`applyIntent`); add a **policy** module that chooses legal intents. After each human mutating request (and on session create/resume when it is the computer’s turn), the server runs the computer until the human must act or the match ends. Mini App gains “Play vs computer” + difficulty; snapshot labels the opponent. Miss/Pie/declare/hints/achievements unchanged in meaning.

## Technical Context

**Language/Version**: TypeScript (existing Next.js Mini App + Node Telegram HTTP server)  
**Primary Dependencies**: Existing `src/quarto/engine`, Telegraf stack, Drizzle/Postgres  
**Storage**: `sessions` table — add `difficulty` (nullable text) and allow seat JSON to mark computer; no new tables  
**Testing**: Vitest unit tests for policy fixtures (safe-give, take-win) + session helper smoke  
**Target Platform**: Telegram Mini App + Cloud Run bot (same as today)  
**Project Type**: Existing Spec Kit feature in monorepo `quarto`  
**Performance Goals**: Computer reply ≤3s Normal/Hard, ≤5s Expert (node budgets / ply caps)  
**Constraints**: Constitution IV–VI (server authority; policy only emits legal intents); no client-trusted “bot move”; FR-015 no Modes A–D  
**Scale/Scope**: Classic4 only; one human + one computer per session

## Constitution Check

| Principle | Gate |
| --- | --- |
| I–II Telegram | Pass — same bot/Mini App |
| III Secrets | Pass — no new secrets |
| IV Do not trust client | Pass — computer moves only server-side; clients cannot POST as `computer` |
| V Rate limits / isolation | Pass — human still auth’d; computer seat not joinable by third party |
| VI State machine | Pass — engine unchanged for legality; policy is separate |
| VII Store little | Pass — difficulty + seat marker only |
| VIII Approved minimum | Pass — scoped to classic vs-computer |

**Gate**: PASS

## Project Structure (touched)

```text
src/quarto/computer/
  types.ts          # Difficulty
  policy.ts         # chooseIntent(state, seat, difficulty)
  threats.ts        # immediate wins, safe gifts helpers
  search.ts         # Expert bounded negamax (optional ply)
src/telegram/
  sessions.ts       # createVsComputer, rematch carry, afterHumanMove hook
  api/handlers.ts   # create/rematch body + runComputerTurns
  COMPUTER_USER_ID  # sentinel id constant
src/components/
  HomeLobby.tsx / Settings.tsx / GamePanel.tsx
src/i18n/en.ts ru.ts
db/schema.ts + migration difficulty
tests/computer-policy.test.ts
```

## Phase 0 / 1 artifacts

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/vs-computer.md](./contracts/vs-computer.md)
- [quickstart.md](./quickstart.md)

## Complexity Tracking

None — no constitution violations.
