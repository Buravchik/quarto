# Feature Specification: Mini App play UX

**Feature Branch**: `cursor/002-miniapp-play-ux-3515`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "Make the Quarto Mini App play surface feel like the real game: recognizable piece shapes for the four traits, clear turn and hand state, and a board that reads at a glance — without changing classic rules or adding new modes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Readable classic board & pieces (Priority: P1)

A player in an active classic match opens the Mini App and sees a 4×4 board and pool where each piece is recognizable by the four Quarto traits (light/dark, tall/short, round/square, solid/hollow) without reading internal piece codes. They can tell which cells are empty and which hold a piece at a glance.

**Why this priority**: Current play UI exposes opaque piece ids; without readable pieces the product does not feel like Quarto even though rules work.

**Independent Test**: Open any active or waiting session in the Mini App; every pool and board piece is identifiable by trait without referring to an id string.

**Acceptance Scenarios**:

1. **Given** a session with pieces in the pool, **When** the player views the pool, **Then** each remaining piece shows all four traits visually (not as a raw code like `p0`).
2. **Given** pieces placed on the board, **When** the player views the board, **Then** placed pieces use the same visual language as the pool and empty cells are clearly empty.
3. **Given** a piece in hand, **When** the player must place, **Then** that piece is visually highlighted as the piece to place (distinct from the pool).

---

### User Story 2 - Clear turn & action state (Priority: P2)

During play, each seated player can tell whose turn it is, what action is expected (give vs place vs pie choice vs declare), and whether the match is waiting, active, or finished — in their language (RU/EN).

**Why this priority**: Without turn/action clarity, players stall or press the wrong controls even when pieces look good.

**Independent Test**: Walk a give → place cycle with two seats; each screen states the expected action for the current user in plain language.

**Acceptance Scenarios**:

1. **Given** it is seat 0’s turn to give, **When** seat 0 views the match, **Then** the UI states that they must choose a piece for the opponent (and seat 1 sees that they are waiting).
2. **Given** a piece is in hand for the placer, **When** that player views the match, **Then** the UI states they must place on an empty cell.
3. **Given** Pie Rule is active and awaiting take/pass, **When** the second player views the match, **Then** the pie choice is the primary action and other move controls are not presented as available.
4. **Given** the match has finished, **When** either player views the match, **Then** the outcome is shown in plain language and rematch controls remain available as today.

---

### User Story 3 - Coherent home & waiting chrome (Priority: P3)

Opening the Mini App without a session, or while waiting for an opponent, keeps the same visual identity (brand colors / piece language) so the product does not feel like a stub around a crude board.

**Why this priority**: Completes the “not empty / not hack” bar for first open and invite wait; secondary to in-match readability.

**Independent Test**: Open the Mini App from the menu with no `sessionId`; lobby uses the same piece/brand language as the board. After starting a match, waiting state explains the next step without raw status codes alone.

**Acceptance Scenarios**:

1. **Given** no session id, **When** the player opens the Mini App, **Then** the lobby shows brand, short tagline, rules toggles, start CTA, and at least a small sample of trait-piece visuals (not only text).
2. **Given** the creator is waiting for seat 1, **When** they view the session, **Then** waiting copy and share affordance are clear; “join” is not offered to the already-seated creator.

---

### Edge Cases

- What happens when a trait pair is hard to see on a small phone screen? → Traits MUST remain distinguishable by shape/structure, not color alone (hollow vs solid, tall vs short, round vs square).
- How does the system handle Telegram light vs dark Mini App chrome? → Play surface MUST remain readable in both; piece contrast MUST work on the existing dark atmospheric background (default) and MUST NOT become illegible if the client uses a light theme shell.
- What if a session has no piece in hand and an empty pool? → UI MUST not invent pieces; empty pool and empty hand states are explicit.
- What if declare selection is in progress? → Selected cells for declare remain visibly marked without hiding piece identity on those cells.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render every classic piece using a visual encoding of all four binary traits; players MUST NOT need internal piece identifiers to play.
- **FR-002**: System MUST use one consistent piece visual language across pool, hand, and board.
- **FR-003**: System MUST make empty board cells visually distinct from occupied cells.
- **FR-004**: System MUST present the current turn and expected action in plain RU/EN copy for the viewing player (give, place, wait, pie choice, declare, finished).
- **FR-005**: System MUST keep classic rules, intents, Miss/Pie, rematch, timeout, and achievements behavior unchanged — this feature is presentation and interaction clarity only.
- **FR-006**: System MUST keep trait identity readable without relying on color alone (shape and structure carry tall/short, round/square, solid/hollow; light/dark MAY use fill contrast but MUST NOT be the only cue for other traits).
- **FR-007**: System MUST preserve existing session deep-links (`sessionId`) and start-from-lobby flow.
- **FR-008**: System MUST show the piece in hand distinctly when the viewer is expected to place.
- **FR-009**: Lobby and waiting states MUST share brand/piece visual identity with the play surface so first open is not an empty instructional stub.
- **FR-010**: Piece art direction MUST follow [NEEDS CLARIFICATION: flat silhouette tokens vs richer 3D-like tokens matching the bot avatar/banner] while remaining clear at Mini App sizes.

### Key Entities

- **Piece appearance**: Mapping from classic trait bits to a visible token (height, outline shape, fill/hollow, light/dark treatment).
- **Play surface state**: Viewer-facing summary of phase, whose turn, hand presence, and available actions (derived from existing session state; no new rules data).
- **Board cell**: Empty or occupied display slot on the 4×4 grid.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a usability check with two players unfamiliar with piece codes, both can correctly name all four traits of a random pool piece in under 10 seconds without help text listing ids.
- **SC-002**: During a give → place exchange, each player correctly identifies whether they should give or place on first glance (≥95% in a 10-turn sample script).
- **SC-003**: First open of the Mini App with no session shows a composed lobby (brand + CTA + piece preview) — zero screens that only say to open a card link.
- **SC-004**: No regression of classic rules: existing automated engine/contract suite for 001 remains green; illegal declare / join / rematch / slot cap still behave as today.
- **SC-005**: On a typical phone-width Mini App viewport, pool and board pieces remain individually distinguishable (no overlapping unreadable blobs).

## Assumptions

- Classic `classic4` module and server-authoritative intents from feature 001 remain the only ruleset; no new modes/catalog.
- Brand palette stays teal + amber / dark atmospheric background already used on Pages.
- Achievements panel from 001 stays; this feature may restyle lightly but does not redefine unlocks.
- Target users open the Mini App inside Telegram on mobile; desktop Telegram is secondary but must remain usable.
- “Feel like the real game” means tabletop Quarto readability, not copying Sudoku’s UX (constitution: Sudoku is architecture reference only).
