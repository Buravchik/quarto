# Telegram manual smoke (quickstart A–G)

## Automated coverage (what it does / does not)

| Check | Command | Covers |
|-------|---------|--------|
| Engine + API contracts | `npm test` | Rules, auth, rematch — **not** Mini App shell |
| initData race unit | `npm run test:miniapp` | Late `Telegram.WebApp` after mount |
| Mini App lobby e2e | `npm run build && npm run smoke:miniapp` | Lobby CTA after late initData (Playwright) |
| API prod A–G | `BOT_TOKEN=… npm run smoke:api` | Cloud Run intents — **not** UI |
| Game screen fit (021) | `npm run build && npm run smoke:layout` | No horizontal overflow at 320–430 px (waiting / invite / active, RU+EN) |

Two real Telegram accounts are still required for full give/place UX feel.

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

## 021 — BotFather prerequisites

1. Main Mini App enabled for @tgquarto_bot (URL `https://buravchik.github.io/quarto/`).
2. `/newapp` short name (e.g. `play`) → Cloud Run env `TELEGRAM_MINI_APP_SHORT_NAME=play`.
3. `/setinlinefeedback` → 100 %.
4. DB migration `supabase/migrations/20261125160000_live_card_invites.sql` applied **before** the bot deploy.

## 021 — Invite + live card (two accounts: A = host, B = guest)

| # | Scenario | Steps | Expect |
|---|----------|-------|--------|
| H | iPhone fit | A (iPhone): Mini App → Play with a friend → waiting screen; then a live game | Board, pool and header fit; nothing cut on the right; vertical swipe on the board does not collapse the app |
| I | Share = this game | A: share icon → pick group G | Message in G is the real card: «Кварто · A зовёт сыграть», button **Присоединиться**; never «preparing…» |
| J | Invite beats old game | B: start a game vs computer, leave Mini App open; in G tap **Присоединиться** | Mini App opens the invite screen «A зовёт тебя в Кварто» (+ chat title if card came from /new in G), **Присоединиться**, «Вернуться к своей партии» |
| K | Join | B: **Присоединиться** | Both in the same game; the card in G switches to «В игре · ход …» (edited, not a new message) |
| L | Live card, no spam | Play 6–8 moves | Card in G is edited each move (who moves); no new messages in G; while both have the app open — no DMs |
| M | Absent player | B closes the Mini App; A moves | B gets **one** DM «Кварто · против A … Ваш ход» with Open; next time it is replaced, not stacked |
| N | 🔄 fallback | Inline feedback off (or update lost): tap 🔄 on the card | «Карточка обновлена»; card now updates live |
| O | Inline fallback | Old Telegram client (no shareMessage): share icon | Chat picker with the same card for this session |
| P | Vs computer quiet | A: Play vs computer, finish a game | Zero bot messages in DM |
| Q | /new in group | In G: `/new` | Card shows «Чат: «G»»; B's invite screen shows the chat title |
| R | Native | In game: Telegram Back button → lobby; selection/moves have haptics; switching light/dark theme updates colours; closing during an active PvP game asks for confirmation | As described |
