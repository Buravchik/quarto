# Feature Specification: Post-Start play chrome

**Feature Branch**: `cursor/post-start-chrome-3515` (feature id `004-post-start-chrome`)

**Created**: 2026-11-20

**Status**: Implemented (code in #13; Spec Kit 004 formalizes + tasks converge; T010 human quickstart pending)

**Input**: After the player presses Start in the Mini App, Session rules and other lobby chrome must leave the play surface. Hot-fixed in #13 without Spec Kit — this feature formalizes the invariant and completes SDD.

## Clarifications (encoded 2026-11-20)

- **When rules hide**: Immediately after Start creates/opens a session — including **waiting for opponent**, not only after the match becomes active. (“In-match” in #9 was too narrow and caused the bug.)
- **Where Miss/Pie are chosen**: Only on the **home lobby** before Start. After Start, the play surface MUST NOT show the Session rules editor (even if the API still allows settings until join).
- **Achievements**: MUST NOT sit under an open session play surface (home lobby only). Collapsed-on-home remains fine.
- **Leaving**: “New match” / leave returns to home lobby where rules and achievements may appear again.
- **Scope**: Presentation chrome only — classic rules, intents, Miss/Pie lock-on-join, Telegram loop from 003 unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start clears lobby chrome (Priority: P1)

A player opens the Mini App with no session, sets Miss/Pie if desired, presses Start. The next screen is waiting/share (or join if they opened a link) — **without** Session rules checkboxes and **without** an achievements block under the match.

**Why this priority**: User explicitly rejected Start that left Session rules visible; this is the trust break for the lobby→play transition.

**Independent Test**: From home lobby, Start once; visually confirm Session rules and achievements are gone while waiting for opponent.

**Acceptance Scenarios**:

1. **Given** home lobby with Session rules visible, **When** the player presses Start and a session opens, **Then** Session rules are not shown on the play surface (including waiting).
2. **Given** that waiting play surface, **When** the player looks below the match chrome, **Then** achievements are not shown until they leave back to home.
3. **Given** waiting or active play, **When** the player leaves to start a new match, **Then** home lobby again shows Session rules (and achievements) for the next create.

---

### User Story 2 - Rules language on lobby (Priority: P2)

On the home lobby, Session rules labels follow the player’s language (RU/EN) like the rest of the Mini App.

**Why this priority**: Hardcoded English “Session rules” on a RU client worsens the same lobby trust failure.

**Independent Test**: Open Mini App with RU language; lobby Session rules title and Miss/Pie labels are Russian.

**Acceptance Scenarios**:

1. **Given** RU language from Telegram, **When** the player views home lobby, **Then** Session rules title and option labels are RU.
2. **Given** EN language, **When** they view home lobby, **Then** labels are EN.

---

### Edge Cases

- Start fails (API error): player remains on home lobby; Session rules stay available.
- Player opens Mini App via deep link with `sessionId` already set: play surface rules/achievements chrome stay hidden (same as after Start).
- Opponent joins / match becomes active: Session rules remain hidden (no regression of #9 intent).
- Creator previously could edit Miss/Pie while waiting: **out of scope to restore** in this feature; create-time choice on lobby is sufficient.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST show Session rules (Miss/Pie) on the home lobby before Start so the creator can choose options for the new session.
- **FR-002**: System MUST NOT show Session rules on the play surface after a session is open (waiting, active, pie, or finished).
- **FR-003**: System MUST NOT show the achievements panel on the play surface while a session is open.
- **FR-004**: System MUST allow return to home lobby (new match / leave) where Session rules and achievements may appear again.
- **FR-005**: Session rules labels on the lobby MUST use the same RU/EN language selection as the rest of the Mini App.
- **FR-006**: Classic engine rules, join lock of Miss/Pie, rematch, Telegram card/notify loop, and poll refresh MUST remain unchanged (presentation-only feature).

### Key Entities

- **Home lobby**: Pre-session surface — brand, Start, Session rules, optional achievements.
- **Play surface**: Any view with an open session id — waiting, active play, finished; no Session rules editor; no achievements block.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After one successful Start from home, a reviewer finds **zero** Session rules controls on the waiting play surface.
- **SC-002**: After Start, a reviewer finds **zero** achievements UI under that session until leave/home.
- **SC-003**: On RU Telegram language, home lobby Session rules strings are Russian (not English-only hardcoded).
- **SC-004**: No regression of classic match play or 003 Telegram loop (existing smoke / manual card path still works).

## Assumptions

- #13 already shipped the intended UI behavior; this feature’s implement phase is primarily **converge** (map code to FRs) plus any residual gaps found in plan/tasks.
- Settings API may still exist for lock-on-join; absence of UI after Start is acceptable.
- Spec 002’s “Expressive lobby includes rules” remains true for **home only**; this feature narrows “in-match” to “any open session.”
