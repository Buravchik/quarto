# Feature Specification: Waiting action icons

**Feature Branch**: `cursor/waiting-action-icons-3515` (feature id `007-waiting-action-icons`)

**Created**: 2026-11-20

**Status**: Implemented (awaiting Pages + human T006)

**Input**: On waiting, “Copy debug link” should be a small corner icon; Share via Telegram and New match should also be icons instead of wide text buttons.

## Clarifications (encoded 2026-11-20)

- **Share / New match**: Icon-primary controls (Expressive icon buttons), not full-width text bricks. Accessible name via `aria-label` from existing RU/EN copy.
- **Debug copy**: Small icon tucked in a **corner** of the waiting chrome (not a centered text link).
- **Join path**: Join + New match also use the same icon-button pattern for density consistency.
- **Feedback**: After copy, brief visual/state change on the debug icon (e.g. check) without expanding layout.
- **Scope**: Waiting chrome presentation only; share/`switchInlineQuery` behavior unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Icon actions while waiting (Priority: P1)

Creator waiting for opponent sees compact icon controls for Share and New match, freeing vertical space for the board.

**Acceptance Scenarios**:

1. **Given** creator waiting, **When** viewing waiting chrome, **Then** Share and New match are icon buttons (not long text labels as the primary face).
2. **Given** those icons, **When** activated, **Then** Share still opens Telegram share and New match still leaves to home.

### User Story 2 - Debug copy as corner icon (Priority: P1)

Debug/Pages link copy is a small icon in the corner of waiting chrome.

**Acceptance Scenarios**:

1. **Given** creator waiting, **When** viewing chrome, **Then** debug copy is a small corner icon, not a centered underlined sentence.
2. **Given** tap on that icon, **When** clipboard succeeds, **Then** brief confirmation appears without a full-width button.

## Requirements *(mandatory)*

- **FR-001**: Waiting Share and New match MUST present as icon buttons with accessible names.
- **FR-002**: Debug copy MUST be a small corner icon with accessible name.
- **FR-003**: Icon actions MUST preserve existing Share / leave / copy behaviors.
- **FR-004**: RU/EN accessible labels MUST remain available (aria-label / title).

## Success Criteria *(mandatory)*

- **SC-001**: Waiting action strip height is clearly smaller than two full text CTAs + text link.
- **SC-002**: Screen reader / long-press title still conveys Share, New match, and debug copy meaning.
