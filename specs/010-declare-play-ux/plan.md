# Implementation Plan: Declare play UX

**Branch**: `cursor/declare-play-ux-3515` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

## Summary

Add session `declareHints` (default false, lock on join). Snapshot exposes hint inputs. Mini App: declare banner, board highlights, optional legal-line hints + tap-to-select-set; remove index-primary copy.

## Technical Context

Migration `declare_hints`; Settings/HomeLobby; sessions snapshot; Board hint props; GamePanel declare UX; unit for hint listing helper.

## Constitution Check

Hints are presentation; engine still decides declare. Pass VI/VIII.
