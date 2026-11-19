# Contract: Mini App → Bot HTTP API

Machine-readable: [openapi.yaml](./openapi.yaml) (OpenAPI 3.1).

All mutating requests:

- Header or body field: Telegram WebApp `initData` (raw string).
- Server validates HMAC; extracts `user.id`.
- On failure: `401` `{ "error": "invalid_init_data" }`.
- Actor must be seated on the target session (except create/join waiting flows).
- Rate limit: soft reject `429` when exceeded.

Base path: `/api/v1` (served by bot Node process).

## GET `/api/v1/cards/:cardId`

Return card status + up to 8 slots summary for Mini App render.

**200**

```json
{
  "cardId": "…",
  "slots": [
    {
      "sessionId": "…",
      "status": "waiting|pie|active|finished",
      "missMode": "persistent|void",
      "pieRule": false,
      "seats": [{ "telegramUserId": "1", "displayName": "…" }, null],
      "outcome": null
    }
  ]
}
```

## POST `/api/v1/cards`

Create card + optional first waiting slot. Actor becomes owner.

**Body**: `{ "initData": "…", "missMode": "persistent", "pieRule": false }`  
**201**: `{ "cardId": "…", "sessionId": "…" }`  
**409**: card/slot limit not applicable on create of first slot.

## POST `/api/v1/cards/:cardId/slots`

Create additional waiting slot on card (creator or any authenticated user per product: **creator or seated policy — v1: any authenticated user may open a free slot if under cap**).

**Body**: `{ "initData": "…", "missMode": "persistent", "pieRule": false }`  
**201**: `{ "sessionId": "…" }`  
**409**: `{ "error": "slot_cap", "max": 8 }`

## POST `/api/v1/sessions/:sessionId/join`

Join as seat1 if waiting and not already seated.

**Body**: `{ "initData": "…" }`  
**200**: session snapshot  
**409**: full / already started / self-join twice

Locks `missMode`/`pieRule` on success.

## POST `/api/v1/sessions/:sessionId/settings`

Update Miss/Pie. Allowed only for slot creator while `settingsLocked === false`.

**Body**: `{ "initData": "…", "missMode": "…", "pieRule": true }`  
**403** if locked or not creator.

## POST `/api/v1/sessions/:sessionId/intent`

Apply one engine intent.

**Body**:

```json
{
  "initData": "…",
  "type": "give|place|declare|pie_choice|resign|claim_timeout",
  "pieceId": "optional",
  "cellIndex": "0-15 optional",
  "setCells": [0, 1, 2, 3],
  "pieTake": true
}
```

**200**: `{ "session": { /* snapshot */ }, "events": ["turn_changed", …] }`  
**400**: `{ "error": "illegal_declare" | "illegal_move" | "wrong_phase", "message": "…" }` — match continues on `illegal_declare`  
**403**: not your turn / not seated  
**409**: `claim_timeout` too early (`retryAfterSeconds`)

## POST `/api/v1/sessions/:sessionId/rematch`

Offer or accept rematch.

**Body**: `{ "initData": "…", "action": "offer|accept|decline" }`  
**200**: `{ "newSessionId": "…" }` on accept; else offer state.

## GET `/api/v1/me/achievements`

**Body/query**: initData  
**200**: `{ "unlocked": ["first_match"], "pinned": ["first_quarto"] }`

## POST `/api/v1/me/achievements/pin`

**Body**: `{ "initData": "…", "pinned": ["first_match", "host"] }` max 2  
**400** if >2 or unknown id.
