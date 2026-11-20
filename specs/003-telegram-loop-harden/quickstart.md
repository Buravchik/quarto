# Quickstart validation: 003-telegram-loop-harden

## Automated

```bash
npm test
npm run test:contract
BOT_TOKEN=… npm run smoke:api   # must pass give→place (turnSeat-aware)
```

## Telegram (two accounts) — required for ship

1. Acc1: menu Mini App → Start → receive bot card/DM with Open (no ↗).
2. Acc2: open via card `web_app` → Join.
3. Both keep Mini App open; Acc1 give → Acc2 sees hand without reopen (≤5s).
4. Acc2 place → Acc1 sees board update.
5. After a turn flip, notified player taps Open on DM → lands in session.
6. Share primary is not “paste github.io in Chrome”.

## Webhook

```bash
# After Cloud Run deploy: getWebhookInfo shows WEBHOOK_URL + inline updates
```
