# Implementation Plan: Move + win highlight

**Branch**: `cursor/017-move-win-highlight-3515` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

## Summary

Expose `lastPlacerSeat` on session snapshot. Mini App: vs-computer marks computer’s last placed cell until the next place by either side that changes last placer; on declare win, highlight `declaredSet`, list all shared traits, and show You/Computer/Opponent won.

## Technical Context

**Language/Version**: TypeScript (existing)  
**Storage**: none new  
**Testing**: Vitest unit for `sharedTraitsForSet`  
**Constraints**: Constitution IV/VI — no client-invented wins; declare windows unchanged

## Constitution Check

| Principle | Gate |
| --- | --- |
| IV Do not trust client | Pass — chrome only from server fields |
| VI State machine | Pass — engine untouched for legality |
| VIII Approved minimum | Pass — presentation + one snapshot field |

**Gate**: PASS

## Touched paths

```text
src/telegram/sessions.ts          # lastPlacerSeat on snapshot
src/quarto/sharedTraits.ts        # NEW
src/components/Board.tsx
src/components/GamePanel.tsx
src/theme/expressive.css
src/i18n/en.ts ru.ts
tests/unit/quarto/shared-traits.test.ts
specs/017-move-win-highlight/*
```
