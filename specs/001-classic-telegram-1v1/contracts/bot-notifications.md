# Contract: Bot → Player notifications

Emitted by server after successful intents / joins (not by Mini App).

| Event | Who receives | Meaning |
|-------|----------------|---------|
| `opponent_joined` | seat0 (creator) | Seat1 joined; settings locked; play starting |
| `your_turn` | current `turnSeat` | Must give / place / pie_choice / may declare |
| `match_ended` | both seats | Includes outcome summary |
| `rematch_offered` | other seat | Accept/decline |
| `timeout_available` | waiting seat | Optional ping when 24h elapsed (does not end match) |

Delivery (both):

1. **Card message** — always edit/update the challenge card in place (`group` or `dm` surface) so slots/status stay visible in the chat.
2. **DM ping** — also notify the relevant player in private when possible (`your_turn`, `match_ended`, `rematch_offered`, `timeout_available`, `opponent_joined`).

Copy is i18n RU/EN. Card shows short status per slot (waiting / turn / finished), not a full board. Deep link / button opens Mini App.
