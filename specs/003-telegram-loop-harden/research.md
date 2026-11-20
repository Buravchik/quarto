# Research: 003-telegram-loop-harden

## R1 — Live board updates

- **Decision**: Client poll `GET /sessions/:id` every ~2.5s while GamePanel mounted; also refresh on `visibilitychange` → visible.
- **Rationale**: Meets SC-001 without new infra; server remains authority.
- **Alternatives**: SSE/WebSocket — deferred; Telegram `sendData` — not for opponent sync.

## R2 — Lobby Start ↔ Telegram card

- **Decision**: After `POST /cards`, bot sends the starter a DM (or edits flow) with `formatCardMessage` + `web_app` Open for that `sessionId` (reuse createCard + notify transport). If bot cannot DM, surface error in lobby.
- **Rationale**: FR-003; avoids orphan sessions; uses existing card APIs.
- **Alternatives**: Force `/new` only — worse menu UX; deep-link `t.me/bot?startapp=` — optional later.

## R3 — Share affordance

- **Decision**: Primary share = Telegram `switchInlineQuery` / “Drop in a chat” or copy **bot deep link** if available; demote Pages URL to secondary “Copy debug link” or remove from primary waiting UI.
- **Rationale**: FR-004.
- **Alternatives**: Keep Pages copy as primary — rejected.

## R4 — Notification web_app

- **Decision**: Extend notify transport `sendMessage` to accept optional reply_markup with `web_app` URL via `miniAppUrl(sessionId)`; localize with player language from DB snapshot when present, else EN.
- **Rationale**: FR-006/010.

## R5 — Webhook bootstrap

- **Decision**: On process start when `WEBHOOK_URL` set, call `bot.telegram.setWebhook(WEBHOOK_URL, { allowed_updates: [...] })` and log result.
- **Rationale**: FR-008.

## R6 — Smoke give→place

- **Decision**: After join, read `turnSeat` + seats; pick initData for that seat; give; then other seat places.
- **Rationale**: FR-009; fixes 17/19 false confidence.
