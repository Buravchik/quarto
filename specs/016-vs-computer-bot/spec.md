# Feature Specification: Play vs computer (classic Quarto)

**Feature Branch**: `cursor/016-vs-computer-bot-3515` (feature id `016-vs-computer-bot`)

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: “Пока не могу найти напарника — добавим бота для игры в одиночку; изучить стратегии Кварто в интернете и сделать умные ходы; действовать по Spec Kit.”

## Clarifications (encoded 2026-11-20)

Defaults taken from product research (`docs/strategii-kvarto-dlya-bota.md` / research report) so this feature can plan without blocking questions:

- **Format**: Same classic 4×4 give-and-place 1v1 as today — second seat is a **computer opponent**, not the solitaire “fill the board without Quarto” match type from `docs/modes.md`.
- **Entry**: From the Mini App on a challenge card: creator (or a seated player starting a new slot) can start **Play vs computer** without waiting for a human join.
- **Difficulty**: Four named levels — Easy, Normal, Hard, Expert — chosen before the match starts and locked for that session.
- **Intelligence ladder**: Easy may miss some instant wins; Normal always takes its own win and never gifts an instant win; Hard adds threat / safe-piece pressure; Expert adds bounded exact search in the late game. Perfect whole-game tablebases are out of scope.
- **Declare**: Computer always declares Quarto when it has a legal win (including Miss claims). No “forgetful” Expert; forgetfulness is Easy-only.
- **Miss / Pie**: Same session checkboxes as human 1v1; computer obeys them (always declares; always takes a legal Miss claim; accepts Pie swap if the human chooses).
- **Language**: Russian and English, consistent with existing Mini App copy.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start and finish a match vs computer (Priority: P1)

A player opens the Mini App from a challenge card, chooses Play vs computer, sets Miss/Pie and a difficulty, and plays a full classic match alone. The computer fills the second seat, plays on its turns without human help, and the match ends in win, loss, draw, or resign with the same clarity as a human match.

**Why this priority**: Unblocks solo testing and casual play without a second Telegram account.

**Independent Test**: One Telegram user completes a classic match against the computer on Normal and sees a correct final outcome.

**Acceptance Scenarios**:

1. **Given** a challenge card Mini App with a free slot, **When** the player starts Play vs computer with Normal difficulty, **Then** a classic session begins immediately with the computer as the other seat (no human join wait).
2. **Given** it is the computer’s turn to place or give, **When** the player waits, **Then** the computer acts without further player input and the board/hand update for the human.
3. **Given** the computer can legally declare Quarto (or Miss-claim), **When** that opportunity exists, **Then** the computer does so and wins (Normal and above; Easy may sometimes fail to take an instant win).
4. **Given** a finished vs-computer match, **When** the player views the result, **Then** they see who won (or draw/resign) with the computer labeled as the opponent, not as a second human name.

---

### User Story 2 - Difficulty that feels smarter (Priority: P2)

Before start, the player picks Easy / Normal / Hard / Expert. Higher levels gift fewer free wins and apply stronger give/place choices, matching the researched ladder (never gift a killer piece → pressure safe pieces → late exact search).

**Why this priority**: The user’s ask was an intelligent opponent, not only a random placeholder.

**Independent Test**: Same opening position: Easy eventually gifts a trivial win that Normal refuses; Hard/Expert refuse unsafe gifts when a safe gift exists.

**Acceptance Scenarios**:

1. **Given** Normal or higher, **When** the computer must give a piece and at least one safe piece remains, **Then** it does not give a piece the human can place into an immediate Quarto.
2. **Given** Normal or higher, **When** the computer holds a piece that wins on some empty cell, **Then** it places there and declares.
3. **Given** Hard or Expert, **When** multiple legal places/gives exist, **Then** the computer prefers moves that reduce the human’s safe gifts or create multiple threats over pure random among “non-losing” moves.
4. **Given** Expert late game (few empty cells), **When** the computer to move, **Then** it uses a deeper exact look-ahead within a response-time budget so the Mini App does not feel stuck.

---

### User Story 3 - Rematch and rules parity (Priority: P3)

After a vs-computer game, the human can rematch the computer with the same Miss/Pie/difficulty unless they change settings before the new start. Timeout claim against a stalled **human** still works; the computer never stalls its own turn beyond the product’s normal move latency.

**Why this priority**: Completes the solo loop without inventing a second product surface.

**Independent Test**: Finish vs computer → rematch → new session vs computer with same difficulty; resign ends the match for the human.

**Acceptance Scenarios**:

1. **Given** a finished vs-computer session, **When** the human offers rematch and confirms, **Then** a new vs-computer session starts (computer reseated) carrying prior Miss/Pie/difficulty unless changed.
2. **Given** an active vs-computer match on the human’s turn, **When** the human resigns, **Then** the computer wins.
3. **Given** it is the computer’s turn, **When** more than a brief thinking delay elapses, **Then** the computer still moves (no 8h timeout claim needed against the computer).

---

### Edge Cases

- What if a human tries to join a seat already filled by the computer? → Refused; seat is occupied.
- What if Play vs computer is chosen while waiting for a human who has not joined? → Starting vs computer converts/fills the open seat with the computer for that new or current waiting slot per product rules (no third player); documented in plan as one clear path.
- What if Easy “misses” a win and the human later claims under Miss? → Legal Miss rules apply; computer still takes Miss claims on Normal+.
- What if the board fills with no Quarto? → Automatic draw, same as human 1v1.
- What if Pie is ON? → After first place, the human (second seat or as assigned) gets the pie choice; if the computer is the pie chooser, it stays or swaps by a fixed honest policy (no opening theory required).
- What if the player closes the Mini App mid-match? → Session persists; on reopen, if it is the computer’s turn, the computer moves when the session is next advanced by the server/product path.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let a player start a classic Quarto 1v1 session where the opponent seat is a computer player, without requiring a second human Telegram account.
- **FR-002**: Computer sessions MUST use the same classic rules engine as human 1v1 (give-and-place, declare-with-set, automatic draw, Miss, Pie) — no alternate solitaire win condition in this feature.
- **FR-003**: System MUST expose four difficulty choices before start: Easy, Normal, Hard, Expert; the choice MUST lock for that session when play begins.
- **FR-004**: On Normal and above, the computer MUST take any immediate legal win available on its turn (place+declare and/or legal Miss claim) before other goals.
- **FR-005**: On Normal and above, when giving a piece, the computer MUST NOT give a piece that allows an immediate human Quarto on some empty cell if any safe alternative exists.
- **FR-006**: On Hard and Expert, after satisfying FR-004/FR-005, the computer MUST prefer moves that create or preserve pressure (threats / fewer safe gifts for the human) over uniform random among remaining legal moves.
- **FR-007**: On Expert, in late game the computer MUST use bounded exact look-ahead under a fixed thinking budget so a human turn still receives a timely computer reply.
- **FR-008**: Easy MAY omit FR-004/FR-005 sometimes so beginners can win; it MUST still only play legal moves.
- **FR-009**: Mini App MUST label the opponent as a computer (localized) and show the chosen difficulty on the session surface.
- **FR-010**: System MUST support resign by the human; rematch into a new vs-computer session carrying Miss/Pie/difficulty unless changed.
- **FR-011**: Computer MUST never require the human to claim an 8h timeout to progress the computer’s own turn; computer turns complete automatically within the thinking budget.
- **FR-012**: A third party MUST NOT sit in a computer-filled seat; human-vs-human slots remain available as separate slots on the card.
- **FR-013**: Vs-computer matches MUST count toward existing achievements that are defined by match outcomes (e.g. first match, first Quarto, draw) unless an achievement text explicitly requires a human opponent (none do today).
- **FR-014**: Party rules for legality and outcomes remain in the testable state machine; computer move selection is a policy on top of legal intents (constitution VI).
- **FR-015**: This feature MUST NOT implement Modes A–D, N-player, teams, elimination, or solitaire fill-board from the modes catalog.

### Key Entities

- **Computer seat**: Opponent identity on a 1v1 session that is not a human Telegram user; tagged with difficulty.
- **Difficulty**: Easy | Normal | Hard | Expert — locked per session at start.
- **Vs-computer session**: Classic match session whose second seat is a computer seat; otherwise same entities as human 1v1 (board, pool, hand, Miss/Pie, outcome).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A single player can start and finish a vs-computer classic match without a second human account.
- **SC-002**: In scripted positions, Normal never gifts an immediate win when a safe gift exists (100% of such fixture cases).
- **SC-003**: In scripted positions, Normal/Hard/Expert always take an immediate available Quarto/Miss win (100% of fixtures).
- **SC-004**: After the human completes their intent, the computer’s reply appears within **3 seconds** on Normal/Hard under casual load, and within **5 seconds** on Expert under the thinking budget.
- **SC-005**: At least **90%** of solo testers in a small manual smoke can complete one full game vs Normal without assistance.
- **SC-006**: Product copy makes clear this is vs computer, not the solitaire catalog mode.

## Assumptions

- One computer policy family for classic only; future modes may need separate policies later.
- No separate Telegram bot account is required; the existing game bot hosts vs-computer sessions.
- Research ladder in `docs/strategii-kvarto-dlya-bota.md` guides behavior strength, not UI chrome.
- Opening theory is nearly null; Expert strength comes from mid/late tactics, not memorized first gives.
