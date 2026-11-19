# Telegram bot visuals

| File | Use in BotFather / Bot API |
|------|----------------------------|
| `bot-avatar.jpg` | Profile photo (`/setuserpic`) — square |
| `bot-banner.jpg` | Description picture — wide |
| [`../launch-screen.svg`](../launch-screen.svg) | Mini App launch screen — **light** theme |
| [`../launch-screen-dark.svg`](../launch-screen-dark.svg) | Mini App launch screen — **dark** theme |

## Launch screens (manual — no Bot API)

BotFather only (as of Bot API changelog 2024-11-17):

1. Open [@BotFather](https://t.me/BotFather) → `/mybots` → **@tgquarto_bot**
2. **Bot Settings** → **Configure Mini App** → **Enable Mini App** (if needed)
3. Set Mini App URL: `https://buravchik.github.io/quarto`
4. Upload **light** launch icon from Pages:  
   https://buravchik.github.io/quarto/launch-screen.svg  
   (or the local file `public/launch-screen.svg`)
5. Upload **dark** launch icon:  
   https://buravchik.github.io/quarto/launch-screen-dark.svg

Menu button is already `Play Quarto` → Pages URL via Bot API.

## Prod smoke (API)

```bash
BOT_TOKEN=… node scripts/smoke-prod.mjs
```

Live two-account Telegram play (quickstart A–G) remains manual.

Do not commit `.env`. Token stays local.
