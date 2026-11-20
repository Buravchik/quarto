# Implementation Plan: 8h timeout + countdown

**Branch**: `cursor/timeout-8h-countdown-3515` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

## Summary

Change `TIMEOUT_MS` to 8h; gate Claim UI to waiting seat + ready; show live countdown otherwise. Update unit tests; redeploy Cloud Run bot + Pages.

## Technical Context

`src/quarto/timeout.ts`, `GamePanel.tsx`, i18n, `tests/unit/quarto/timeout.test.ts`.

## Constitution Check

Rules stay in state machine (VI); UI only presents gate. Pass.
