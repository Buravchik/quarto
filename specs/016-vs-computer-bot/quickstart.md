# Quickstart: Play vs computer

## Dev

1. Branch `cursor/016-vs-computer-bot-3515`.
2. Apply DB migration (`difficulty` column).
3. `npm test` — policy fixtures must pass.
4. Run bot + Mini App as usual; open Mini App → **Play vs computer** → Normal.

## Manual smoke

| # | Steps | Expect |
| --- | --- | --- |
| A | Start vs computer Normal, Miss OFF | Match starts; opponent labeled computer; no wait-for-join |
| B | Play until computer can win | Computer places + declares |
| C | Force position where only unsafe gifts remain vs Normal | Computer still only legal moves; prefers safe if any |
| D | Easy: play until trivial computer win available | Sometimes skipped (legal continue) |
| E | Rematch | New computer session, same difficulty |
| F | Resign | Computer wins |
| G | Second human tries join URL | Rejected |

## Unit fixtures (must ship)

1. Three-in-a-row + winning piece in hand → Normal places+declares.
2. Pool has safe and unsafe gifts → Normal never picks unsafe.
3. Expert budget: chooseIntent returns within 5s on midgame fixture.
