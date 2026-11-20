# Feature Specification: Telegram play-loop hardening

**Feature Branch**: `cursor/telegram-loop-harden-3515` (feature id `003-telegram-loop-harden`)

**Created**: 2026-11-20

**Status**: Clarified (defaults from post-002 product audit; ready for plan)

**Input**: Harden the Quarto Telegram product loop so challenge card, Mini App, turn notifications, and opponent visibility form one native Telegram game — closing gaps found after 001/002 (orphan lobby sessions, no live board refresh, browser share, weak DMs, incomplete prod smoke, webhook bootstrap).

## Clarifications (encoded 2026-11-20)

- Live board while Mini App is open: **client poll** of session snapshot (no new realtime product dependency in this feature).
- Menu / lobby “Start”: MUST create a session that is reachable as a **Telegram challenge card** (bot message with `web_app` Open), not an orphan API-only row.
- Opponent invite primary path: **card / bot**, not a raw GitHub Pages URL as the main share affordance.
- Turn / join / end notifications: MUST include a **`web_app` button** into that `sessionId`.
- All “Open Mini App” controls: Telegram **`web_app`**, never plain `url` (already fixed for card; keep as invariant).
- Cloud Run boot with `WEBHOOK_URL`: MUST register webhook + allowed updates (incl. inline) on startup.
- Prod smoke: MUST prove give→place using the **actual turn seat** (random opener).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See opponent moves without reopening (Priority: P1)

Two players have the Mini App open on the same match. When one gives or places, the other sees the updated board, pool, hand, and turn prompt without closing and reopening the Mini App.

**Why this priority**: Without this, async 1v1 feels broken even when rules work.

**Independent Test**: Two seats; A gives; B’s open Mini App shows hand/board change within a few seconds without manual reload.

**Acceptance Scenarios**:

1. **Given** both players have the match open, **When** A completes a give, **Then** B’s UI shows the piece in hand and place prompt without reopen.
2. **Given** polling is active, **When** the match finishes, **Then** both UIs show finished state without reopen.
3. **Given** `prefers-reduced-motion` or backgrounded WebView, **When** the app returns to focus, **Then** state refreshes promptly.

---

### User Story 2 - One Telegram entry path (card + Mini App) (Priority: P1)

Starting from the bot menu or lobby creates (or surfaces) a challenge card with a `web_app` Open button for that session. Sharing with an opponent does not push a browser URL as the primary invite. `/start` offers Open Mini App via `web_app`.

**Why this priority**: Spec 001 is card-centric; orphan lobby sessions and browser share break the product concept.

**Independent Test**: From menu Mini App with no `sessionId`, Start yields a path where a Telegram message/card can open that session in-app; share UI does not present github.io as the primary invite.

**Acceptance Scenarios**:

1. **Given** no `sessionId`, **When** the player starts a match from the Mini App lobby, **Then** they get a seated waiting session and a Telegram-native way to open/share it (card or bot DM with `web_app`), not only an orphan API row.
2. **Given** waiting for opponent, **When** the creator uses the primary share affordance, **Then** it is Telegram-native (bot/card/`web_app`), not “copy Pages URL” as the sole/primary action.
3. **Given** `/start`, **When** the bot replies, **Then** a `web_app` control opens the Mini App (in addition to any existing inline drop).

---

### User Story 3 - Notifications return you to the match (Priority: P2)

Turn, opponent-joined, and match-ended bot messages include a `web_app` button that opens the Mini App on that `sessionId`. Notification language follows the player’s language when known.

**Why this priority**: Completes the Telegram loop around async turns.

**Independent Test**: After a turn change, the notified player taps the button and lands in that session inside Telegram.

**Acceptance Scenarios**:

1. **Given** it becomes a player’s turn, **When** the bot notifies them, **Then** the message has Open/`web_app` for that session.
2. **Given** an opponent joins, **When** the creator is notified, **Then** the same applies.
3. **Given** the player’s language is RU, **When** notified, **Then** copy is RU when language is available.

---

### User Story 4 - Ops & verification gates (Priority: P2)

Production bot registers its webhook on boot. Automated prod smoke proves a full give→place using whichever seat is to move. Manual two-account checklist remains the release bar for this feature.

**Why this priority**: Prevents “green lies” and silent webhook drift.

**Independent Test**: Smoke script exits 0 on give→place; new Cloud Run revision logs successful setWebhook (or equivalent confirmation).

**Acceptance Scenarios**:

1. **Given** `WEBHOOK_URL` is set, **When** the bot process starts, **Then** Telegram webhook is set with updates including `inline_query` and `chosen_inline_result`.
2. **Given** prod smoke runs with a valid bot token, **When** opener is seat 1, **Then** give is sent as seat 1 and still passes.
3. **Given** feature ship, **When** reviewers use two Telegram accounts, **Then** quickstart A (give→place visible to both) passes.

---

### Edge Cases

- What if only one player has the Mini App open? → Poll updates that client; the other still gets bot notification with `web_app`.
- What if poll fails transiently? → UI keeps last good snapshot; next poll retries; no invented board state.
- What if lobby cannot post a card (API/bot error)? → Show clear error; do not pretend a shareable match exists.
- What if multiple slots on a card? → Open/`web_app` targets the relevant `sessionId` for that notification or the slot being played; do not silently open a different slot.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: While a match view is open in the Mini App, the client MUST refresh authoritative session state on an interval (and on foreground) so opponent actions become visible without reopen.
- **FR-002**: Refresh MUST NOT apply moves client-side; server snapshot remains source of truth (constitution IV/VI).
- **FR-003**: Starting a match from the Mini App lobby MUST result in a Telegram-native open/share path for that session (challenge card and/or bot message with `web_app`), not an orphan session with only a website URL.
- **FR-004**: Primary invite/share affordance MUST NOT be a raw GitHub Pages URL; Pages URL MAY remain a secondary diagnostic only if still exposed.
- **FR-005**: `/start` MUST offer a `web_app` control to open the Mini App.
- **FR-006**: Bot notifications for turn, opponent joined, and match ended MUST include a `web_app` button opening that `sessionId`.
- **FR-007**: Every user-facing “Open Mini App” control MUST use Telegram `web_app` (not `url`).
- **FR-008**: When `WEBHOOK_URL` is set, process start MUST register the webhook with Telegram including inline-related allowed updates.
- **FR-009**: Prod API smoke MUST execute give→place as the seat that currently must act (respect random opener) and fail the run if that path fails.
- **FR-010**: Notification copy SHOULD use the recipient’s language when known; EN fallback allowed.
- **FR-011**: Classic rules, Miss/Pie, rematch, achievements unlock logic remain unchanged except where notification/share UX requires presentation changes.

### Key Entities

- **Play session view**: Mini App match screen bound to `sessionId`, with poll lifecycle.
- **Challenge card message**: Telegram message (DM/group/inline) carrying live status + `web_app` open for a session.
- **Turn notification**: Bot DM (or chat-appropriate message) with localized text + `web_app` deep link into session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With two Mini Apps open on one match, opponent’s give/place is visible on the other client within 5 seconds under normal network.
- **SC-002**: From menu Mini App Start, a second Telegram account can join/play without pasting a github.io URL into a browser.
- **SC-003**: Tapping Open on a turn notification opens the correct session inside Telegram Mini App.
- **SC-004**: `npm run smoke:api` (prod smoke) passes give→place regardless of which seat opens.
- **SC-005**: After Cloud Run deploy, webhook info shows the expected URL and allowed updates including inline.
- **SC-006**: Existing 001 engine/contract suite remains green.

## Assumptions

- Polling interval on the order of 2–3 seconds is acceptable for v1 hardening; websockets/SSE out of scope unless trivial.
- Creating a card from lobby may use existing `POST /cards` plus a bot-sent DM/card to the starter (same Telegram user), or instruct `/new` — implementation chooses the path that satisfies FR-003 without new game modes.
- BotFather Mini App domain already allowlists Pages host.
- Feature is presentation/ops/loop hardening; no new Quarto rule packs.
