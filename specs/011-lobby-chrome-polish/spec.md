# Feature Specification: Lobby chrome polish

**Feature Branch**: `cursor/lobby-rules-collapse-3515` (feature id `011-lobby-chrome-polish`)

**Created**: 2026-11-20

**Status**: Ready for implement

**Input**: Waiting “+” reads as add, not new match; Session rules should start collapsed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New-match affordance (Priority: P1)

On waiting chrome, the control that returns to lobby / starts a new match MUST NOT use a plus/add icon. Icon MUST read as new match / restart.

### User Story 2 - Collapsed session rules (Priority: P1)

On the home lobby, Session rules MUST be collapsed by default. Player can expand to change Miss / Pie / Declare hints.

## Requirements *(mandatory)*

- **FR-001**: Replace plus icon on `backHome` / new-match waiting actions with a restart-style icon.
- **FR-002**: Session rules UI defaults to collapsed; expand is optional.

## Success Criteria *(mandatory)*

- **SC-001**: Waiting secondary action no longer shows “+”.
- **SC-002**: Fresh lobby load shows Session rules collapsed.
