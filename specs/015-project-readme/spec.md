# Feature Specification: Project README

**Feature Branch**: `cursor/project-readme-3515` (feature id `015-project-readme`)

**Created**: 2026-11-20

**Status**: Clarified (ready for plan)

**Input**: Root README missing; document product description and all Quarto rules researched for this project (classic + Miss/Pie + modes catalog + BGG provenance notes).

## Clarifications (encoded 2026-11-20)

- **Q1 — Language**: README primary **Russian** (rules digests are RU); keep commands/paths in English as in repo.
- **Q2 — Scope**: One root `README.md` — product overview, how to run, constitution pointer, **full v1 rules**, and **catalog of researched modes** (future modules). Not a second constitution file.
- **Q3 — Authority**: README documents product/rules intent; live behavior still follows `src/quarto` + approved Spec Kit features. Mark HOUSE / not-in-v1 clearly.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Newcomer understands the game (Priority: P1)

A reader opens `README.md` and learns what this Telegram Quarto is, how classic play works, and Miss/Pie.

### User Story 2 - Modes backlog visible (Priority: P1)

Researched future modes (geometry, pick models, boards, match types) appear as a catalog with conflict groups, not as implemented features.

## Requirements *(mandatory)*

- **FR-001**: Root `README.md` MUST exist.
- **FR-002**: MUST include product blurb, bot/Mini App pointers, Spec Kit/constitution pointers, run/test/deploy sketch.
- **FR-003**: MUST include classic 4×4 rules, Miss Void/Persistent, Pie Rule, auto-draw as shipped v1.
- **FR-004**: MUST include researched modes catalog + conflict groups + N-player types + Icehouse Quinto OUT.
- **FR-005**: MUST label not-yet-implemented modes as future / HOUSE where provenance is weak.

## Success Criteria *(mandatory)*

- **SC-001**: README present on `master` after merge.
- **SC-002**: v1 rules and researched catalog are both covered without claiming unimplemented modes are live.
