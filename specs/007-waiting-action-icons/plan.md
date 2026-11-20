# Implementation Plan: Waiting action icons

**Branch**: `cursor/waiting-action-icons-3515` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

## Summary

Replace waiting text CTAs with Expressive icon buttons; put debug copy as a small corner icon on the waiting headline surface.

## Technical Context

Inline SVG icons (no icon pack). CSS `ex-icon-btn` + waiting toolbar layout in `GamePanel` / `expressive.css`.

## Constitution Check

Presentation-only; Pass VIII.

## Structure

```text
specs/007-waiting-action-icons/
src/theme/expressive.css
src/theme/icons.tsx          # Share / Plus / Link / Check SVGs
src/components/GamePanel.tsx
```
