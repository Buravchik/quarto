# Telegram manual smoke (quickstart A–G)

API prod smoke covers most paths (`BOT_TOKEN=… node scripts/smoke-prod.mjs`).  
This checklist is what still needs two real Telegram accounts.

## Setup

- Bot: [@tgquarto_bot](https://t.me/tgquarto_bot)
- Mini App menu: **Play Quarto**
- Launch screens: already uploaded in BotFather (light/dark)

## Checklist

| # | Scenario | Steps | Expect |
|---|----------|-------|--------|
| A | Classic start | Acc1: open Mini App → **Start a match** (or `/new`). Acc2: open session link / Join | Board + pool; Acc1 can give a piece |
| A | Give → place | Acc1 give → Acc2 place | Hand clears; piece on board; turn flips |
| B | Illegal declare | Mid-game declare four empty/wrong cells | Error, board unchanged |
| C | Miss Void | New match, Miss ON before join; skip a line then opponent places | Void / claim rules as per Miss |
| D | Persistent | Miss OFF; late claim on a completed line after place | Win allowed when legal |
| E | Timeout UI | Stall (or wait); waiting seat sees claim control | Button only for waiting seat; early claim rejected |
| F | Rematch | Finish → offer → accept | New session on same card |
| F | Slot cap | 8 slots on one card → 9th | Refused |
| G | Achievements | Finish/host paths; pin two on home panel | Pins ≤2; card shows pins |

## Pass criteria

- Mini App home is not empty (lobby + Start a match).
- Inline `@tgquarto_bot` drops a card that opens Mini App.
- One full classic game finishes with a clear outcome.
