# Implementation Plan: Waiting one-row chrome

**Branch**: `cursor/waiting-one-row-3515` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

## Summary

Move Share / New-match (and Join) icon buttons into the waiting status surface as one horizontal flex row with the headline. Remove the separate `ex-actions-row` under the pill for waiting paths. Keep debug corner. CSS: flex row, ellipsis headline, padding for corner + trailing icons.

## Technical Context

**Language/Version**: TypeScript / React / CSS  

**Primary Dependencies**: `GamePanel.tsx`, `expressive.css`  

**Storage**: None  

**Testing**: `npm test`; `npm run build`; visual quickstart  

**Target Platform**: Telegram Mini App  

**Constraints**: Constitution VIII — presentation only

## Constitution Check

| Principle | Response | Status |
|-----------|----------|--------|
| I–II Telegram | Mini App chrome | Pass |
| III–VII | Unchanged | Pass |
| VIII Minimum | Spec 012 only | Pass |

## Project Structure

```text
specs/012-waiting-one-row/
src/components/GamePanel.tsx
src/theme/expressive.css
```

## Complexity Tracking

> None.
