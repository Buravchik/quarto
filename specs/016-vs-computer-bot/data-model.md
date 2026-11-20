# Data Model: Play vs computer

## Session (extended)

| Field | Type | Notes |
| --- | --- | --- |
| `difficulty` | `text` nullable | `easy` \| `normal` \| `hard` \| `expert` when vs computer; `null` for human 1v1 |
| `seat0` | jsonb | Human creator `{ telegramUserId, joinedAt }` |
| `seat1` | jsonb | Computer: `{ telegramUserId: "computer", joinedAt }` **or** human join as today |

**Invariant**: If `difficulty IS NOT NULL`, then `seat1.telegramUserId === "computer"` after start. Human join MUST fail on such sessions.

## Difficulty

Enum string (API + DB): `easy` | `normal` | `hard` | `expert`.

Locked when match starts (`settingsLocked` / status `active`) — same lock moment as Miss/Pie.

## Snapshot additions

| Field | Meaning |
| --- | --- |
| `difficulty` | null \| enum |
| `opponentKind` | derived: `computer` if seat1 id is `computer`, else `human` |
| `opponentLabel` | optional server hint; client may i18n from `opponentKind` |

## Computer policy inputs (not persisted)

- `EngineState` + `computerSeat` (always 1 in v1) + `Difficulty`
- Output: one `Intent` legal for that seat

## Migration

- Add nullable `difficulty` column to `sessions`.
- Existing rows remain human 1v1 (`difficulty` null).
