# Implementation Plan: Human challenge card chrome

**Branch**: `cursor/human-card-chrome-3515` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

## Summary

Rewrite `formatCardMessage` for human RU/EN status; pass owner language from notify/bot; redeploy Cloud Run.

## Structure

`src/telegram/cards.ts`, `notify.ts`, `bot.ts`, i18n card keys, unit test optional.
