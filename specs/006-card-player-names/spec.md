# Feature Specification: Challenge card player names

**Feature Branch**: `cursor/card-player-names-3515` (feature id `006-card-player-names`)

**Created**: 2026-11-20

**Status**: Implemented (awaiting Cloud Run T008 + human card check)

**Input**: Challenge card waiting line shows numeric Telegram user id (`100303072 vs —`) instead of the player’s name.

## Clarifications (encoded 2026-11-20)

- **Label source**: Prefer Telegram **display name** (`first_name` + optional `last_name`); if empty, `@username`; never prefer raw numeric id when a name/username is known.
- **Persistence**: Store/update `displayName` on the player record when the user acts via Mini App `initData` or bot commands, so card refreshes keep showing the name.
- **Empty seat**: Second seat still shows an empty marker (`—` / waiting), not an id.
- **Privacy**: Cards already show who is seated in a challenge the player shared; showing first name is intended for human-readable lobby status (001 card status text).
- **Scope**: Card message formatting + player profile touch on create/join/bot; no Mini App board UI change required.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Card shows names (Priority: P1)

A player starts a match; the bot challenge card lists their name (or @username), not their numeric Telegram id, while waiting for an opponent.

**Why this priority**: Raw ids make the card look broken and non-product.

**Independent Test**: Start from Mini App or `/new`; read card text — seated player is a human-readable name.

**Acceptance Scenarios**:

1. **Given** a creator with Telegram first name, **When** a challenge card is posted/DM’d, **Then** the waiting line uses that name (not the numeric id).
2. **Given** only a username is available, **When** the card is formatted, **Then** `@username` is used.
3. **Given** seat 1 empty, **When** the card is formatted, **Then** the second side is an empty/waiting marker, not an id.

---

### User Story 2 - Name stays current (Priority: P2)

When the same player joins or creates again later, the stored display name is refreshed from Telegram so cards do not stay stuck on an empty or stale blank name.

**Acceptance Scenarios**:

1. **Given** an existing player row with empty display name, **When** they create/join via Mini App, **Then** display name is updated before the card text is built.

## Requirements *(mandatory)*

- **FR-001**: Challenge card seat labels MUST use human-readable Telegram name/username when known.
- **FR-002**: System MUST NOT prefer numeric Telegram user id over an available display name or username on card text.
- **FR-003**: Creating a card or joining a seat via Mini App or bot MUST refresh the actor’s stored display name from Telegram identity when available.
- **FR-004**: Empty seats MUST remain a non-id placeholder.

## Success Criteria *(mandatory)*

- **SC-001**: On a fresh Start with a named Telegram account, card waiting line contains no seated numeric id as the primary label.
- **SC-002**: Empty opponent side is still clearly empty (`—` or equivalent), not an id.

## Assumptions

- `players.displayName` column already exists; no migration required beyond writing values.
- Achievement pin suffixes on labels may remain if already present.
