# Telegram bot visuals

| File | Use in BotFather / Bot API |
|------|----------------------------|
| `bot-avatar.jpg` | Profile photo (`/setuserpic`) — square |
| `bot-banner.jpg` | Description picture — wide |
| [`../launch-screen.svg`](../launch-screen.svg) | Mini App launch screen — **light** theme |
| [`../launch-screen-dark.svg`](../launch-screen-dark.svg) | Mini App launch screen — **dark** theme |

Launch screens live in `public/` (served on Pages) so BotFather can pull HTTPS URLs after deploy, same pattern as Sudoku.

Do not commit `.env`. Token stays local.
