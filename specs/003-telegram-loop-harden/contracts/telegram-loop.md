# Contract: Telegram play loop (003)

## Mini App session poll

- While match UI mounted: refresh `GET /api/v1/sessions/:sessionId?initData=` on interval (~2.5s) and on document visible.
- Replace local snapshot with server JSON; do not merge inventively.

## Open Mini App controls

- InlineKeyboardButton MUST use `web_app: { url }` — never `url` for Open Mini App.
- URL shape: `{TELEGRAM_WEBAPP_URL with trailing /}?sessionId={uuid}`

## Lobby start → Telegram

- After successful `POST /api/v1/cards`, system MUST deliver a Telegram message to the starter with card text + `web_app` for `sessionId` (bot DM preferred).

## Notifications

- turn / opponent_joined / match_ended DMs MUST include `web_app` for that session.
- Prefer recipient language when known.

## Webhook boot

- If `WEBHOOK_URL` set: `setWebhook` with allowed_updates including `message`, `callback_query`, `inline_query`, `chosen_inline_result`.

## Prod smoke

- Resolve acting seat from `turnSeat` before give; other seat places; fail run if either fails.
