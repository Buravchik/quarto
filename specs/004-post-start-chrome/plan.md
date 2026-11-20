# Implementation Plan: Post-Start play chrome

**Branch**: `cursor/post-start-chrome-3515` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

## Summary

Formalize and verify that after Start (any open session), the Mini App play surface never shows Session rules or achievements. Miss/Pie remain home-lobby-only; labels are i18n. Primary code already landed in #13 — this plan drives Spec Kit converge + residual gap check.

## Technical Context

**Language/Version**: TypeScript 5 / Node 22 / React 19  

**Primary Dependencies**: Existing Next static Mini App, i18n tables  

**Storage**: None  

**Testing**: Manual Mini App Start path; `npm run build`; no engine changes  

**Target Platform**: Telegram Mini App (GitHub Pages)  

**Project Type**: Presentation chrome / UX invariant  

**Performance Goals**: N/A  

**Constraints**: Constitution VIII — chrome only; no classic rule changes  

**Scale/Scope**: `HomeLobby` / `GamePanel` / `app/page` / `Settings` labels  

## Constitution Check

| Principle | Response | Status |
|-----------|----------|--------|
| I–II Telegram | Mini App chrome only | Pass |
| III Secrets | Unchanged | Pass |
| IV–VI Authority | No client-authoritative rules | Pass |
| VII Store little | No new data | Pass |
| VIII Minimum | Spec 004 chrome invariant only | Pass |

**Post-design**: Pass.

## Project Structure

```text
specs/004-post-start-chrome/
├── plan.md, research.md, data-model.md, quickstart.md, contracts/, tasks.md
app/page.tsx                      # achievements only on home (no sessionId)
src/components/HomeLobby.tsx      # Settings + Start
src/components/GamePanel.tsx      # no Settings
src/components/Settings.tsx       # i18n labels from copy
src/i18n/{en,ru}.ts               # sessionRules / missVoid / pieRule
```

## Complexity Tracking

> None. Converge-first: map #13 to FRs; only patch if gaps remain.
