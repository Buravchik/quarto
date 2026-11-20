# Research

## R1 — Default hints off

- **Decision**: `declareHints` default **false**.
- **Rationale**: User — missing your win is part of the fun; hints opt-in.

## R2 — Hint source

- **Decision**: Reuse `pendingVoidSets` / `completedSetsThrough` + `canDeclareSet` for legal lines; expose `pendingVoidSets` + `lastPlacedCell` + `declareHints` on snapshot.
