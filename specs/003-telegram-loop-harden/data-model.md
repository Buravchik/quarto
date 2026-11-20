# Data Model: 003-telegram-loop-harden

No new persisted tables. Uses existing `MatchSession`, `ChallengeCard`, `PlayerIdentity` from 001.

## Presentation / ops entities

### SessionPollHandle (client-only)

| Field | Notes |
|-------|--------|
| `sessionId` | Polled session |
| `intervalMs` | ~2500 |
| `lastSnapshotAt` | For UI freshness |

### NotificationPayload

| Field | Notes |
|-------|--------|
| `telegramUserId` | Recipient |
| `text` | Localized |
| `sessionId` | For `web_app` URL |
| `kind` | turn \| joined \| ended |

## Validation

- Poll MUST NOT write game state.
- `web_app` URL MUST include trailing slash base + `sessionId` query.
