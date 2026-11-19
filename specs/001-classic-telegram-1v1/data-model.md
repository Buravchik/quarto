# Data Model: 001-classic-telegram-1v1

## Entities

### PlayerIdentity

| Field | Notes |
|-------|--------|
| `telegramUserId` | Primary key (opaque string/int64) |
| `displayName` | Snapshot at last join (not authoritative PII store beyond need) |
| `language` | `ru` \| `en` preference |
| `achievementIds` | Unlocked set |
| `pinnedAchievementIds` | Max length 2 |

### ChallengeCard

| Field | Notes |
|-------|--------|
| `cardId` | Public id embedded in deep link / start_param |
| `ownerTelegramUserId` | Creator |
| `chatId` | Telegram chat where card message lives (nullable if private-only) |
| `messageId` | Bot message to edit for live status |
| `createdAt` | |
| `slots` | 0..8 `MatchSession` references |

**Validation**: Creating a slot when `slots.length === 8` → reject.

### MatchSession

| Field | Notes |
|-------|--------|
| `sessionId` | |
| `cardId` | Parent card |
| `status` | `waiting` \| `pie` \| `active` \| `finished` |
| `missMode` | `persistent` \| `void` (default persistent) |
| `pieRule` | boolean (default false) |
| `modules` | string[] active rule module ids (v1: `["classic4"]` or empty ≡ classic) |
| `settingsLocked` | true after second seat joins |
| `seat0` / `seat1` | `{ telegramUserId, joinedAt } \| null` |
| `openerSeat` | 0 \| 1 after random assign (may swap after pie) |
| `turnSeat` | whose action is required |
| `phase` | engine phase (see transitions) |
| `board` | 16 cells: `null` or piece id |
| `pool` | remaining piece ids |
| `pieceInHand` | piece id or null |
| `voidedSets` | list of set masks dead under Void |
| `turnNotifiedAt` | timestamp for 24h claim |
| `outcome` | `null` \| `{ type: win\|draw\|resign\|timeout, winnerSeat?, declaredSet? }` |
| `rematchOfSessionId` | optional link |
| `createdAt` / `updatedAt` | |

### Piece

Canonical 16 ids: bitfield of 4 binary traits (color, height, shape, top).

### AchievementDef (static config)

Ids: `first_match`, `first_quarto`, `drawn_board`, `rematch`, `host`, `comeback_seat` — unlock predicates in code; not user-editable rows beyond unlock flags on PlayerIdentity.

## Session phases (classic engine)

```text
waiting
  → (seat1 joins, settings lock, opener random, first give)
select_give          # current giver picks piece for opponent
  → place_received
place_received       # holder places; may declare
  → [pie_choice if pieRule && first place done && not resolved]
  → select_give | finished
pie_choice           # second player take-or-pass
  → select_give
finished
```

Void window: after place, before give hand-off — placer may declare; if they give without declaring, receiver may declare before place (lines through last placed cell only). Persistent: after own place only, any still-valid undeclared set containing that cell.

Illegal declare → rejected, phase unchanged.

## Relationships

- Card 1—* Session (max 8)
- Session *—* PlayerIdentity via seats (exactly 0–2)
- PlayerIdentity 1—* unlocks AchievementDef

## Lifecycle notes

- Resign: active/pie → finished (`resign`)
- Timeout claim: only waiting seat, only if `now - turnNotifiedAt >= 24h` → finished (`timeout`)
- Rematch: new Session on same Card copying miss/pie; seats empty or prefilled by offer/accept flow
