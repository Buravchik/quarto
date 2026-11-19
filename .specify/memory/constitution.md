<!--
Sync Impact Report
- Version change: (empty template) → 1.0.0
- Modified principles: placeholders → Quatro I–VIII (see draft)
- Added sections: Security & integrity; Delivery
- Removed sections: none
- Deferred: product language (RU/EN); Mini App required at MVP — specify/clarify if needed
- Remove this report comment before treating the file as settled governance (optional cleanup)
-->

# Quatro Constitution

## Core Principles

### I. Telegram game
Quatro is a game that runs on Telegram.

### II. Telegram platform
Ship through Telegram's official bot and/or Mini App APIs.

### III. Secrets stay out of the repo
Bot tokens and keys live in env or a secret store. Not in git. Not in the client bundle. Not logged in full.

### IV. Do not trust the client
The server checks who sent the request (for example Telegram `initData`), validates every field, and sanitizes input. The server decides game state. The client does not.

### V. Rate limits and player isolation
The backend limits how often a client can call it. A player may only act in their own games and sessions. They must not change another player's game or progress.

### VI. Rules live in a state machine
Party rules (states, transitions, moves, win/lose, score) live in a state machine. Telegram code delivers events and shows results. It does not decide transitions. The state machine runs in tests without a live bot.

### VII. Store little
Keep only what you need to play and to operate. Do not log message bodies or extra personal data.

### VIII. Build the approved minimum
Implement what the approved Spec Kit feature requires. Do not add speculative features.

## Security & integrity

- Treat every Mini App or client write as untrusted until auth and validation pass.
- Reject or ignore requests that fail auth, field checks, or ownership checks.
- Prefer failing closed when ownership of a game or session is unclear.

## Delivery

- Spec Kit drives work: constitution → specify → plan → tasks → implement → converge (plus clarify/checklist/analyze when needed).
- Choose the tech stack in `/speckit-plan`, not here.
- Sudoku is an architecture reference only. Do not copy its product UX.

## Governance

This file beats informal habit when they conflict.

Change it in git with a short rationale. Version bumps:

- MAJOR — remove or redefine a principle
- MINOR — add a principle or section
- PATCH — wording only

Plan, implement, and converge must respect these principles. If something is unclear, amend this file instead of silently ignoring it.

**Version**: 1.0.0 | **Ratified**: 2026-11-19 | **Last Amended**: 2026-11-19
