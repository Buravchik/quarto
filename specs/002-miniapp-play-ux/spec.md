# Feature Specification: Mini App play UX

**Feature Branch**: `cursor/002-miniapp-play-ux-3515`

**Created**: 2026-11-20

**Status**: Implemented (awaiting merge / converge)

**Input**: User description: "Make the Quarto Mini App play surface feel like the real game: recognizable piece shapes for the four traits, clear turn and hand state, and a board that reads at a glance — without changing classic rules or adding new modes."

**Clarifications (2026-11-20)**:
- Pieces must stay readable when **future rule packs** add or remap multiple traits — visual encoding is modular by trait channel, not a one-off classic skin.
- App chrome must follow **Material 3 Expressive** (shape language + springy motion + expressive emphasis). If MUI does not ship Expressive yet, achieve the look via M3 Expressive tokens/motion/shapes on top of whatever component base is chosen in plan — not by waiting for a full MUI Expressive release.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Readable classic board & pieces (Priority: P1)

A player in an active classic match opens the Mini App and sees a 4×4 board and pool where each piece is recognizable by the four Quarto traits (light/dark, tall/short, round/square, solid/hollow) without reading internal piece codes. They can tell which cells are empty and which hold a piece at a glance. The same visual system is structured so a later mode with a different trait set can still map traits to clear visual channels without redesigning the whole UI.

**Why this priority**: Current play UI exposes opaque piece ids; without readable pieces the product does not feel like Quarto even though rules work. Future modules (FR-019 from 001) will fail if art is locked to “pretty but non-extensible” one-offs.

**Independent Test**: Open any active or waiting session in the Mini App; every pool and board piece is identifiable by trait without referring to an id string. A reviewer can name which visual channel encodes which classic trait.

**Acceptance Scenarios**:

1. **Given** a session with pieces in the pool, **When** the player views the pool, **Then** each remaining piece shows all four traits visually (not as a raw code like `p0`).
2. **Given** pieces placed on the board, **When** the player views the board, **Then** placed pieces use the same visual language as the pool and empty cells are clearly empty.
3. **Given** a piece in hand, **When** the player must place, **Then** that piece is visually highlighted as the piece to place (distinct from the pool).
4. **Given** the classic four binary traits, **When** a designer inspects the piece system, **Then** each trait maps to a **dedicated visual channel** (e.g. height band, outline family, fill vs aperture, tone/contrast) so channels do not collapse into “color only” or a single silhouette quirk that cannot absorb extra traits later.

---

### User Story 2 - Clear turn & action state (Priority: P2)

During play, each seated player can tell whose turn it is, what action is expected (give vs place vs pie choice vs declare), and whether the match is waiting, active, or finished — in their language (RU/EN). Primary actions use Expressive emphasis (shape/motion), not a flat wall of identical controls.

**Why this priority**: Without turn/action clarity, players stall or press the wrong controls even when pieces look good.

**Independent Test**: Walk a give → place cycle with two seats; each screen states the expected action for the current user in plain language; the primary CTA is visually dominant.

**Acceptance Scenarios**:

1. **Given** it is seat 0’s turn to give, **When** seat 0 views the match, **Then** the UI states that they must choose a piece for the opponent (and seat 1 sees that they are waiting).
2. **Given** a piece is in hand for the placer, **When** that player views the match, **Then** the UI states they must place on an empty cell.
3. **Given** Pie Rule is active and awaiting take/pass, **When** the second player views the match, **Then** the pie choice is the primary action and other move controls are not presented as available.
4. **Given** the match has finished, **When** either player views the match, **Then** the outcome is shown in plain language and rematch controls remain available as today.

---

### User Story 3 - Expressive shell (lobby, waiting, play chrome) (Priority: P1)

Opening and playing the Mini App feels like a finished Material 3 Expressive product: expressive shapes, springy motion on key interactions, clear hierarchy — not a dark page with Georgia text and raw form controls. Lobby, waiting, and in-match chrome share one expressive system.

**Why this priority**: User rejected the current look; Expressive is a product requirement for this feature, not polish-later.

**Independent Test**: First open (no session) and an in-match screen both show Expressive shape/motion language (asymmetric/rounded containers, springy press/selection feedback, clear primary surfaces) while remaining readable in Telegram.

**Acceptance Scenarios**:

1. **Given** no session id, **When** the player opens the Mini App, **Then** the lobby is a composed Expressive surface (brand, short tagline, rules, primary Start CTA, piece preview) — not a stub paragraph.
2. **Given** the creator is waiting for seat 1, **When** they view the session, **Then** waiting copy and share affordance are clear; “join” is not offered to the already-seated creator.
3. **Given** the user taps primary controls (Start, Give, Place, Pie, Declare), **When** the interaction animates, **Then** motion feels springy/Expressive (with reduced-motion fallback), not linear “instant swap” only.
4. **Given** Telegram light or dark chrome, **When** the Mini App is open, **Then** surfaces remain readable and Expressive tokens adapt (no illegible amber-on-cream or lost contrast).

---

### Edge Cases

- What happens when a trait pair is hard to see on a small phone screen? → Traits MUST remain distinguishable by **orthogonal channels** (structure first); color/tone is never the sole cue for non-tone traits.
- How does a future module with ≠4 traits fit? → Piece renderer MUST be driven by module trait metadata (count + ordered channels), not hardcoded “always four SVG variants”; classic4 supplies the first mapping.
- How does the system handle Telegram light vs dark Mini App chrome? → Expressive theme MUST provide light and dark schemes; default may follow Telegram `colorScheme`.
- What if a session has no piece in hand and an empty pool? → UI MUST not invent pieces; empty pool and empty hand states are explicit.
- What if declare selection is in progress? → Selected cells for declare remain visibly marked without hiding piece identity on those cells.
- What if the user prefers reduced motion? → Spatial bounce/morph MUST degrade to short fades / no overshoot; clarity unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render every classic piece using a visual encoding of all four binary traits; players MUST NOT need internal piece identifiers to play.
- **FR-002**: System MUST use one consistent piece visual language across pool, hand, and board.
- **FR-003**: System MUST make empty board cells visually distinct from occupied cells.
- **FR-004**: System MUST present the current turn and expected action in plain RU/EN copy for the viewing player (give, place, wait, pie choice, declare, finished).
- **FR-005**: System MUST keep classic rules, intents, Miss/Pie, rematch, timeout, and achievements behavior unchanged — this feature is presentation and interaction clarity only (no new game modes).
- **FR-006**: System MUST keep trait identity readable without relying on color alone; each trait uses a **dedicated visual channel** that can be remapped when modules change trait sets.
- **FR-007**: System MUST preserve existing session deep-links (`sessionId`) and start-from-lobby flow.
- **FR-008**: System MUST show the piece in hand distinctly when the viewer is expected to place.
- **FR-009**: Lobby and waiting states MUST share brand/piece visual identity with the play surface so first open is not an empty instructional stub.
- **FR-010**: Piece art MUST prioritize **legibility and trait-channel extensibility** over photorealism: structured vector tokens (optional subtle depth) that stay clear at Mini App sizes; avatar/banner 3D is brand reference, not the required piece rendering style.
- **FR-011**: Piece presentation MUST be **module-aware**: classic4 defines the first channel mapping for its four traits; the UI MUST NOT assume forever-fixed “Quarto-only” art that cannot express additional or different traits from later packs.
- **FR-012**: The Mini App MUST follow **Material 3 Expressive** visual language: expressive shape scale (including asymmetric / morph-friendly containers where it aids hierarchy), spring-based motion for key interactions, and clear emphasis on primary actions — across lobby, waiting, and play.
- **FR-013**: If a component library lacks a full “Material Expressive” theme (e.g. MUI without Expressive parity), the product MUST still deliver Expressive look-and-feel via **design tokens + shapes + spring motion** layered on the chosen base — not by blocking the feature on upstream MUI Expressive support.
- **FR-014**: Expressive motion MUST respect `prefers-reduced-motion` (and Telegram-equivalent constraints if exposed).

### Key Entities

- **Trait visual channel**: An ordered, named encoding slot (e.g. stature, plan-shape, aperture, tone) bound to a module trait index; classic4 binds its four bits to four channels.
- **Piece appearance**: Composition of channel encodings into one token for pool/hand/board.
- **Play surface state**: Viewer-facing summary of phase, whose turn, hand presence, and available actions (derived from existing session state; no new rules data).
- **Expressive theme**: Color roles, shape tokens, and motion springs (expressive scheme) for Mini App chrome.
- **Board cell**: Empty or occupied display slot on the module board layout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a usability check with two players unfamiliar with piece codes, both can correctly name all four classic traits of a random pool piece in under 10 seconds without help text listing ids.
- **SC-002**: During a give → place exchange, each player correctly identifies whether they should give or place on first glance (≥95% in a 10-turn sample script).
- **SC-003**: First open of the Mini App with no session shows a composed Expressive lobby (brand + CTA + piece preview) — zero screens that only say to open a card link or “Connecting…” after Telegram init succeeds.
- **SC-004**: No regression of classic rules: existing automated engine/contract suite for 001 remains green; illegal declare / join / rematch / slot cap still behave as today; Mini App lobby smoke remains green.
- **SC-005**: On a typical phone-width Mini App viewport, pool and board pieces remain individually distinguishable (no overlapping unreadable blobs).
- **SC-006**: A reviewer can document the classic4 trait→channel map in one short table; the same table structure could accept a hypothetical fifth trait without inventing a second unrelated art system.
- **SC-007**: Key interactions (Start, piece select, place, primary CTA) show perceptible Expressive spring/morph feedback unless reduced motion is on.

## Assumptions

- Classic `classic4` remains the only **rules** pack in this feature; catalog modes stay out of scope, but **presentation** must not paint the product into a classic-only corner.
- Brand hues may stay teal + amber as Expressive seed colors; Expressive shape/motion overrides the previous “Georgia on flat gradient + raw buttons” look.
- Achievements panel from 001 stays functionally; it is restyled into the Expressive system.
- Target users open the Mini App inside Telegram on mobile; desktop Telegram is secondary but must remain usable.
- Material Expressive is the **design system target** (M3 May 2025 Expressive update: shapes, morph, spring schemes). Implementation may combine CSS tokens, SVG/canvas pieces, and a motion helper; MUI is optional plumbing, not the definition of Expressive.
- Sudoku remains architecture reference only (constitution); do not copy Sudoku product UX.
