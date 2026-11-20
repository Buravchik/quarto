# Feature Specification: 8h timeout claim + countdown

**Feature Branch**: `cursor/timeout-8h-countdown-3515` (feature id `008-timeout-8h-countdown`)

**Created**: 2026-11-20

**Status**: Implemented (awaiting deploy T006)

**Input**: “Claim timeout win” must appear only after more than 8 hours, with a countdown until then.

## Clarifications (encoded 2026-11-20)

- **Window**: Stall threshold is **8 hours** after `turnNotifiedAt` (supersedes 001’s 24h for claim readiness).
- **Who sees it**: Only the **waiting** seat (not the player whose turn it is).
- **Before ready**: Show a **countdown** to claim eligibility; do **not** show an enabled Claim control.
- **When ready**: Show Claim timeout win; countdown ends.
- **Still**: Match does not auto-end; explicit claim required (001 rule kept).
- **Scope**: Engine gate + Mini App chrome + notify readiness; resign unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Countdown then claim (Priority: P1)

While it is the opponent’s turn, the waiting player sees time remaining until they may claim. After 8h from turn notification, Claim appears and works.

**Acceptance Scenarios**:

1. **Given** active match, viewer is waiting seat, <8h since turn notify, **When** they view Mini App, **Then** they see a countdown and **not** an available Claim timeout control.
2. **Given** ≥8h since turn notify, **When** waiting seat views Mini App, **Then** Claim timeout win is available and succeeds.
3. **Given** it is the viewer’s turn, **When** they view Mini App, **Then** neither countdown-as-claim-path nor Claim is offered to them as the claimer.

## Requirements *(mandatory)*

- **FR-001**: Timeout claim readiness MUST be `now - turnNotifiedAt >= 8h`.
- **FR-002**: Mini App MUST show Claim timeout only when the viewer is the waiting seat and the gate is ready.
- **FR-003**: While waiting seat and gate not ready, Mini App MUST show a live countdown to readiness.
- **FR-004**: Server MUST still reject early `claim_timeout` (unchanged error semantics).
- **FR-005**: Spec 001 24h wording is superseded by this feature for the stall window only.

## Success Criteria *(mandatory)*

- **SC-001**: Unit tests prove not-ready before 8h and ready at/after 8h.
- **SC-002**: Waiting UI never shows Claim as available before countdown hits zero.
- **SC-003**: After zero, Claim is visible to waiting seat only.
