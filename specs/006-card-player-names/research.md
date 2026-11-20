# Research

## R1 — Label priority

- **Decision**: `first_name last_name` → `@username` → last-resort short id only if nothing else.
- **Rationale**: User screenshot shows id; product needs human names.

## R2 — When to refresh

- **Decision**: Update `displayName` whenever ensurePlayer is called with a non-empty name (create/join/bot).
- **Rationale**: Existing rows were created with empty name.
