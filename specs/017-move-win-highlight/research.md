# Research: 017 move + win highlight

## Decision 1 — Last-move source of truth

**Decision**: Use existing `lastPlacedCell` + `lastPlacerSeat` (expose seat on snapshot).  
**Rationale**: Q1=A maps directly: highlight while last placer is the computer. No new DB columns.  
**Alternatives**: Client-only “remember last computer place” — races with poll; rejected.

## Decision 2 — Shared traits

**Decision**: Pure helper `sharedTraitsForSet(board, cells, modules)` mirroring `isQuartoSet` AND/NAND per trait bit; map to i18n keys via channel map.  
**Rationale**: Same authority as engine; unit-testable; Q2=A lists all.  
**Alternatives**: Store traits on `outcome` at declare time — unnecessary duplication.

## Decision 3 — Win vs last-move chrome

**Decision**: When finished with `declaredSet`, show win cells only (no last-move ring).  
**Rationale**: Avoid two competing highlights on the same board.
