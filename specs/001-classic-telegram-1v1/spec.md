# Feature Specification: Quarto classic Telegram 1v1

**Feature Branch**: `001-classic-telegram-1v1`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "Build Quarto (Кварто) for Telegram — classic 4×4 1v1 first; Miss and Pie Rule session checkboxes; modular hook for later modes; challenge card; turn notifications; rematch; 24h stall timeout; automatic draw; short achievements."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Challenge card to classic match (Priority: P1)

A player shares a challenge card in a Telegram chat. Another player opens the Mini App from the card, joins or creates a waiting 1v1 slot, and plays a classic Quarto match (4×4, give-and-place). The match ends when someone declares Quarto (pointing the set), when someone resigns or wins by timeout, or when the board fills and the game draws automatically. Either player can leave and later resume an unfinished session from the card.

**Why this priority**: Core product value — play Quarto through Telegram without other modes.

**Independent Test**: Two Telegram users can complete a classic match from a shared card and see a clear win or draw outcome; an unfinished match can be resumed after closing the Mini App.

**Acceptance Scenarios**:

1. **Given** a challenge card with a free 1v1 slot, **When** a second player joins and both play classic rules, **Then** placements and piece hand-offs follow opponent-chooses-piece, and a legal Quarto declaration (with the set pointed) ends the match as a win for the declarer.
2. **Given** all 16 pieces are placed and no unresolved win remains, **When** the last placement finishes without a declaration window, **Then** the match ends in an automatic draw (nobody “calls” draw).
3. **Given** an unfinished match, **When** a player reopens the Mini App from the card, **Then** they resume the same session state (board, turn, piece in hand if any).
4. **Given** an ongoing 1v1 match with two seated players, **When** a third person tries to join that match, **Then** they are refused; they may only use another independent slot on the card.

---

### User Story 2 - Miss and Pie Rule before play (Priority: P2)

Before a match starts, the creating (or configuring) player sets two session checkboxes: Miss (whether a missed set expires) and Pie Rule. The card shows live status for multiple independent 1v1 slots. Play then follows the chosen Miss and Pie settings for that session only.

**Why this priority**: Session variants that belong in v1 without pulling in the full mode catalog.

**Independent Test**: Start two matches on the same card with different Miss/Pie settings and verify each match enforces only its own settings.

**Acceptance Scenarios**:

1. **Given** Miss OFF (Persistent, default), **When** a completed set is not declared in its creation window, **Then** that set does not expire, and a player may declare it only on their own turn immediately after their own later placement, pointing the set.
2. **Given** Miss ON (Void), **When** the placing player hands off without declaring, **Then** the opponent may claim immediately before placing; after the opponent places, that set is dead forever; legal Void declarations only consider lines through the cell just played.
3. **Given** Pie Rule ON, **When** the first piece has been placed, **Then** the second player must choose to take that opening (become first) or stay second before further play.
4. **Given** Pie Rule OFF (default), **When** the first piece is placed, **Then** seating stays as assigned and play continues without a take-or-pass choice.

---

### User Story 3 - Turns, stall, rematch, achievements (Priority: P3)

Players get bot notifications when it is their turn, when an opponent joins, and when a match ends. If a player stalls more than 24 hours after a turn notification, the opponent may claim a timeout win; a player may resign earlier. After a finished match, either player can offer rematch (same Miss/Pie unless changed). A short achievement set exists; a few icons can be pinned by a name on the card; the full list is in the Mini App.

**Why this priority**: Completes the Telegram loop around the classic match without expanding rule modes.

**Independent Test**: Trigger a turn notification; expire a 24h stall into a timeout win; offer and accept rematch; see at least one achievement affordance on the card or in the Mini App list.

**Acceptance Scenarios**:

1. **Given** it becomes a player’s turn, **When** the server advances the turn, **Then** that player receives a Telegram bot notification appropriate to the chat context.
2. **Given** a player has not acted within 24 hours of their turn notification, **When** the opponent claims timeout, **Then** the match ends as a win for the opponent (or the stalled player may resign earlier).
3. **Given** a finished 1v1 match, **When** either player offers rematch and the other accepts, **Then** a new independent 1v1 session appears on the same card with the previous Miss/Pie settings unless changed before start.
4. **Given** the Mini App achievements list, **When** a player unlocks or views achievements, **Then** they can pin a small number of icons next to their name on the challenge card.

---

### Edge Cases

- What happens when the last piece completes a Quarto and the placer declines to declare under Void? → No opponent hand-off remains; declining yields draw if no other unresolved win applies.
- What happens when Persistent would allow a late claim but the declaring player’s placement does not lie on that set? → Declaration is illegal; only after a placement that participates in the claimed set (same “after own place” rule).
- What happens when both players disconnect? → Session persists; either may resume; stall clock follows whose turn it is.
- What happens when rematch is offered but the other player ignores it? → Offer stays pending until accepted, declined, or superseded by a new slot; no automatic match start.
- What happens when Pie Rule is ON but the second player never chooses? → Treated as stall on that decision (same 24h timeout path).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support classic Quarto for exactly two players on a 4×4 board with 16 unique pieces and four binary traits (light/dark, tall/short, round/square, solid/hollow).
- **FR-002**: System MUST enforce opponent-chooses-piece: the opponent selects the piece the current player must place; after placing, that player selects the opponent’s next piece.
- **FR-003**: System MUST choose the opening player at session start (random default).
- **FR-004**: System MUST award a win only when a player declares Quarto and points a legal set of four-in-a-row (row, column, or full diagonal) sharing at least one trait.
- **FR-005**: System MUST end the match in an automatic draw when all 16 pieces are placed and no unresolved win remains; players MUST NOT “call” a draw.
- **FR-006**: System MUST provide a shareable challenge card that can host multiple independent 1v1 sessions with live status text.
- **FR-007**: System MUST let a player create or join a waiting 1v1 slot via Mini App and MUST refuse seating a third player into an ongoing 1v1 match.
- **FR-008**: System MUST persist unfinished session state so either seated player can resume after Mini App close/reopen.
- **FR-009**: System MUST expose session checkboxes Miss and Pie Rule before play; defaults Miss OFF (Persistent), Pie Rule OFF.
- **FR-010**: With Miss OFF (Persistent), the system MUST keep undeclared completed sets claimable, and MUST allow declaration only on the declaring player’s turn immediately after their own placement, with the set pointed.
- **FR-011**: With Miss ON (Void), the system MUST require the placer to declare before hand-off; otherwise the opponent may claim before placing; after the opponent places, that set MUST be dead forever; Void detection/declaration MUST only consider lines through the cell just played.
- **FR-012**: With Pie Rule ON, after the first piece is placed the system MUST present the second player a take-or-pass choice before further placements.
- **FR-013**: System MUST notify a player via the bot when it becomes their turn, when an opponent joins their slot, and when the match ends.
- **FR-014**: System MUST allow resign; and after 24 hours without action from the turn notification, MUST allow the opponent to claim a timeout win.
- **FR-015**: System MUST support rematch from a finished match into a new independent 1v1 session on the same card, carrying Miss/Pie unless changed.
- **FR-016**: System MUST include a short Quarto-specific achievement set, show the full list in the Mini App, and allow pinning a few icons by a player’s name on the card (exact unlock list may be refined in clarify).
- **FR-017**: System MUST NOT provide an AI opponent or global leaderboards in this feature (card status only).
- **FR-018**: System MUST present UI in Russian and English.
- **FR-019**: Product and session model MUST allow later game-mode modules (traits/pick, 4×4 geometry, turn/memory, other boards, separate match types) to plug in without rewriting classic; this feature MUST NOT implement that full catalog. Future modules MUST obey “at most one mode per conflict group” as defined in the project modes catalog.
- **FR-020**: Party rules (states, transitions, legal moves, win/lose/draw) MUST be expressible as a state machine testable without a live Telegram connection (constitution VI).

### Key Entities *(include if feature involves data)*

- **Challenge card**: Shareable Telegram surface; holds multiple independent 1v1 slots and live status; optional pinned achievement icons per player name.
- **Match session (1v1)**: Two seats, Miss/Pie settings, board, pool, piece-in-hand, turn, timers, outcome (win/draw/resign/timeout).
- **Board position**: 16 cells; placed pieces with traits; empty cells.
- **Declaration**: Claim of Quarto with an explicit set of four cells (and implied shared trait(s)).
- **Achievement**: Named unlock with icon; may be pinned on the card.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From an existing challenge card, a waiting player can enter the Mini App and start or join a classic match in ≤2 taps (not counting opening Telegram or signing in).
- **SC-002**: Every finished classic match ends in exactly one of: Quarto win (declared + set pointed), timeout win, resign win, or automatic draw on full board.
- **SC-003**: With Miss OFF, a previously skipped set can be declared only right after the declaring player’s own later placement; with Miss ON, a skipped set cannot be declared after the opponent has placed, and a Void declaration is legal only for a set through the cell just played.
- **SC-004**: Pie Rule OFF leaves seating unchanged after first place; Pie Rule ON presents take-or-pass to the second player before the next placement.
- **SC-005**: When it becomes a player’s turn, they receive a bot notification; when they stall past 24 hours, the opponent can resolve the match without support intervention.
- **SC-006**: Rematch from a finished 1v1 creates a new independent session visible on the same card.
- **SC-007**: Session state survives Mini App close/reopen (resume unfinished match).
- **SC-008**: A third player cannot enter an ongoing 1v1; they can only use another slot or create one.

## Assumptions

- Target users already use Telegram and can open Mini Apps from shared messages.
- v1 scope is classic 4×4 + Miss + Pie + Telegram card loop only; other rule modes and N-player/elimination/solitaire match types are out of this feature (catalogued for later specs).
- Exact achievement names and unlock conditions will be filled in clarify if not listed here; the product still ships a short set.
- “Appropriate to the chat context” notifications means private or group delivery consistent with how the card was shared; exact copy is clarify/plan detail.
- Random opening player is acceptable; dice ritual is not required.
- Server-authoritative game state (constitution); clients display and send intents only.
