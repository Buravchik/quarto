# Research: Play vs computer

**Feature**: `016-vs-computer-bot` | **Date**: 2026-11-20

## R1 — Opponent model

**Decision**: Computer occupies **seat1** with sentinel `telegramUserId = "computer"` and session column `difficulty`. Human remains seat0 (creator).  

**Rationale**: Minimal schema change; rematch/join paths already key off seat JSON; auth rejects any client claiming id `computer`.  

**Alternatives**: Separate `opponentKind` enum without sentinel — clearer but more migration churn; random seat for computer — complicates “creator is human” UX.

## R2 — When the computer moves

**Decision**: After every successful human intent (and after create/start and on GET session if turn is computer), server loop `while turnSeat is computer && !finished`: `chooseIntent` → `applyIntent` → persist. Cap loop iterations (e.g. 8) as safety.  

**Rationale**: Give-and-place can require two computer intents before human acts again; single-shot would strand UI.  

**Alternatives**: Client polls “think” endpoint — slower UX, more trust surface; async worker queue — overkill for <5s search.

## R3 — Policy ladder (from strategy research)

**Decision**:

| Level | Behavior |
| --- | --- |
| Easy | Legal random; ~40% chance to skip immediate win / safe-give filter |
| Normal | Take win/Miss claim; never gift immediate win if safe gift exists; else random legal |
| Hard | Normal + score moves by threat creation / opponent safe-gift count |
| Expert | Hard + bounded exact search when empty cells ≤ 6 (node/time budget) |

**Rationale**: Matches shipped apps’ ladders and `docs/strategii-kvarto-dlya-bota.md`.  

**Alternatives**: Full tablebase — out of scope; MCTS-only — harder to guarantee “never gift mate”.

## R4 — Entry UX

**Decision**: Home lobby primary path adds **Play vs computer** beside human start; difficulty select next to Miss/Pie/hints; creates card+session already joined by computer and `startMatch` invoked.  

**Rationale**: One-player smoke without waiting row. Human-vs-human path unchanged.  

**Alternatives**: Only convert waiting human slot — worse for cold start alone.

## R5 — Notifications / timeout

**Decision**: Do not DM the computer. Skip 8h claim UI against computer turns (computer always completes). Human stall timeout unchanged.  

**Rationale**: Spec FR-011; computer has no Telegram user.

## R6 — Pie when computer is chooser

**Decision**: If computer must resolve Pie, **stay** (pass) — no opening theory.  

**Rationale**: Research: openings nearly null; classic perfect play is draw.

## R7 — Declare

**Decision**: Policy emits `declare` with a concrete winning set when taking a win; never leave a won position undeclared on Normal+.  

**Rationale**: Product requires declare; engines that auto-end would break UX parity.
