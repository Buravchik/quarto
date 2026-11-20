# Feature Specification: Card slot Open target

**Feature Branch**: `cursor/card-slot-open-3515` (feature id `014-card-slot-open`)

**Created**: 2026-11-20

**Status**: Clarified (ready for plan)

**Input**: Challenge cards can hold ≤8 slots (001) but Open Mini App is frozen on the first sessionId at message create; card text refresh does not retarget the button. Next remaining Telegram-card debt after poll/DM web_app/setWebhook/`/start` already shipped.

## Clarifications (encoded 2026-11-20)

- **Q1 — Button count**: Keep **one** primary Open Mini App button (plus Drop in a chat). Not one button per slot (too crowded on mobile).
- **Q2 — Preferred session**: Open targets, in order: first **waiting** slot → else first **active|pie** → else first listed slot (finished/rematch).
- **Q3 — Refresh**: Every card message refresh MUST re-apply `reply_markup` with `web_app` URL for the preferred sessionId (and Drop in a chat).
- **Q4 — Scope**: Card keyboard + preferred-session helper; no Mini App multi-slot browser UI in this feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open follows a joinable slot (Priority: P1)

When a card has a waiting slot that is not the first created session, Open Mini App still opens that waiting session.

**Why this priority**: Otherwise multi-slot cards strand joiners on a finished/active first slot.

**Independent Test**: Two sessions on one card; first finished, second waiting; Open URL contains second sessionId after refresh.

**Acceptance Scenarios**:

1. **Given** card with slot1 finished and slot2 waiting, **When** card is refreshed, **Then** Open `web_app` URL uses slot2’s sessionId.
2. **Given** only active slots, **When** refreshed, **Then** Open targets first active/pie session.

### User Story 2 - Refresh keeps Telegram actions (Priority: P1)

Card edits keep Open + Drop actions; Open stays a `web_app` button (not `url`).

**Acceptance Scenarios**:

1. **Given** a card message with keyboard, **When** status text is edited after a turn, **Then** markup still includes web_app Open for preferred session.

### Edge Cases

- No `TELEGRAM_WEBAPP_URL` → no Open button (same as today).
- Empty slots list → no Open / only Drop if applicable.

## Requirements *(mandatory)*

- **FR-001**: System MUST compute preferred open `sessionId` as: first waiting → else first active|pie → else first slot.
- **FR-002**: Card message refresh MUST pass inline keyboard: Open (`web_app` + preferred session) + Drop in a chat.
- **FR-003**: Open MUST remain Telegram `web_app`, never browser `url`.
- **FR-004**: No engine rule changes.

## Success Criteria *(mandatory)*

- **SC-001**: After multi-slot refresh, Open URL sessionId matches preferred-session helper.
- **SC-002**: Unit covers preference order; bot redeployed so live cards refresh correctly.
- **SC-003**: Spec Kit artifacts complete; constitution I–II/VIII respected.
