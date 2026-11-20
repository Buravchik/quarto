# Research: Post-Start play chrome

## R1 — Why #9 failed users

- **Decision**: Treat “after Start” as “any open `sessionId`”, not `status === active`.
- **Rationale**: Start creates `waiting`; #9 hid Settings only when not waiting → rules stayed. User complaint matched that path.
- **Alternatives**: Keep editable Settings while waiting — rejected; create-time lobby choice is enough and matches Start mental model.

## R2 — Achievements placement

- **Decision**: Achievements on home lobby only; absent under open session.
- **Rationale**: Same “lobby chrome under play” clutter; #9 collapse was insufficient once Start was pressed.
- **Alternatives**: Collapsed achievements under match — rejected for this feature’s SC-002.

## R3 — Converge vs re-implement

- **Decision**: Spec Kit 004 documents FRs; implement phase verifies #13 and patches gaps only.
- **Rationale**: User demanded process after hot fix; rewriting UI twice adds risk without value.
