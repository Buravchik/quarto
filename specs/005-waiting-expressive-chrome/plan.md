# Implementation Plan: Waiting chrome density + Expressive fidelity

**Branch**: `cursor/waiting-expressive-chrome-3515` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

## Summary

Densify waiting actions into one row; demote debug to a text link; dedupe waiting copy; retune primary Expressive CSS (drop thick ledge shadow; stronger asymmetric shape + soft tonal elevation) so waiting reads as M3 Expressive, not homemade bricks.

## Technical Context

**Language/Version**: TypeScript / React / CSS tokens  

**Primary Dependencies**: Existing `expressive.css`, GamePanel  

**Storage**: None  

**Testing**: `npm run build`; visual quickstart on phone-width  

**Target Platform**: Telegram Mini App  

**Constraints**: No MUI; constitution VIII presentation-only  

## Constitution Check

| Principle | Response | Status |
|-----------|----------|--------|
| I–II Telegram | Mini App chrome | Pass |
| III–VII | Unchanged | Pass |
| VIII Minimum | Spec 005 only | Pass |

## Project Structure

```text
specs/005-waiting-expressive-chrome/
src/theme/expressive.css          # primary elevation + compact btn variant
src/components/GamePanel.tsx      # waiting row layout; dedupe copy
specs/002/.../expressive-theme.md # optional note on elevation (no rewrite required)
```

## Complexity Tracking

> None.
