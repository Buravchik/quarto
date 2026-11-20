# Research

## R1 — 8h vs 24h

- **Decision**: Product supersedes 001 to **8 hours**.
- **Rationale**: Explicit user request.

## R2 — Countdown client-side

- **Decision**: Derive from `turnNotifiedAt` + `TIMEOUT_MS`; tick 1s locally; server remains authority on claim.
- **Rationale**: No new API field; poll already refreshes `turnNotifiedAt`.
