# Research: Waiting Expressive chrome

## R1 — One-row actions

- **Decision**: `display: flex` row for Share + New match; debug as `<button class="ex-link">` or text button under the row.
- **Rationale**: User screenshot; FR-001/002.
- **Alternatives**: Icon-only toolbar — deferred (copy clarity for RU/EN).

## R2 — Drop brick shadow

- **Decision**: Replace `box-shadow: 0 0.35rem 0 …` ledge with soft tonal shadow / outline; keep asymmetric `border-radius` + spring scale on press (M3 Expressive motion blog: spatial spring, not faux-3D bricks).
- **Rationale**: User “самодеятельность”; 002 contract wants Expressive shape/motion, not novelty elevation.
- **Alternatives**: Keep ledge — rejected.

## R3 — Duplicate waiting string

- **Decision**: Remove muted `waitingOpponent` under actions when headline already shows it.
- **Rationale**: Screenshot duplication.
