# Implementation Plan: In-game rules button

**Branch**: `cursor/018-in-game-rules-3515` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

## Summary

Add a ghost **?** icon on `GamePanel` that toggles an inline rules panel (classic + read-only session Miss/Pie/hints). Presentation only.

## Technical Context

Mini App only; i18n EN/RU; reuse `ex-icon-btn--ghost` / Expressive tokens.

## Constitution Check

| Principle | Gate |
| --- | --- |
| IV Client trust | Pass — read-only display of server snapshot fields |
| VI Engine | Pass — untouched |
| VIII Scope | Pass — UI chrome |

**Gate**: PASS

## Touched

```text
src/theme/icons.tsx          # IconHelp
src/components/RulesPanel.tsx # NEW
src/components/GamePanel.tsx
src/theme/expressive.css
src/i18n/en.ts ru.ts
specs/018-in-game-rules/*
```
