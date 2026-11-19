# Contract: Bot → Player notifications

Emitted by server after successful intents / joins (not by Mini App).

| Event | Who receives | Meaning |
|-------|----------------|---------|
| `opponent_joined` | seat0 (creator) | Seat1 joined; settings locked; play starting |
| `your_turn` | current `turnSeat` | Must give / place / pie_choice / may declare |
| `match_ended` | both seats | Includes outcome summary |
| `rematch_offered` | other seat | Accept/decline |
| `timeout_available` | waiting seat | Optional ping when 24h elapsed (does not end match) |

Delivery: Telegram message (DM preferred when possible; otherwise reply/edit in card chat per how the card was shared). Copy is i18n RU/EN. No full board dump required in the notification text — deep link / button opens Mini App.
