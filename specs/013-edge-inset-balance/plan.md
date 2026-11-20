# Implementation Plan: Edge inset balance

**Branch**: `cursor/edge-inset-balance-3515` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

## Summary

Make Mini App shell gutters safe-area aware and prevent trailing flush on phone/tablet: viewport-fit cover, calc padding with TG content safe-area vars, overflow-x clip, slightly larger base horizontal gutter.

## Technical Context

**Language/Version**: CSS + Next.js viewport export  

**Primary Dependencies**: `expressive.css`, `app/layout.tsx`  

**Storage**: None  

**Testing**: `npm test`; `npm run build`; human device check  

**Constraints**: Constitution VIII presentation-only

## Constitution Check

| Principle | Response | Status |
|-----------|----------|--------|
| I–II Telegram | Mini App shell | Pass |
| III–VII | Unchanged | Pass |
| VIII Minimum | Spec 013 only | Pass |

## Project Structure

```text
specs/013-edge-inset-balance/
src/theme/expressive.css
app/layout.tsx
```

## Complexity Tracking

> None.
