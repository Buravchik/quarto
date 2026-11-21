# Contract: vs-computer API / snapshot

## POST `/api/v1/cards` (extend)

Body additions (optional):

```json
{
  "initData": "...",
  "surface": "dm",
  "missMode": "persistent",
  "pieRule": false,
  "declareHints": false,
  "vsComputer": true,
  "difficulty": "normal"
}
```

Rules:

- If `vsComputer === true`, `difficulty` REQUIRED (`easy|normal|hard|expert`).
- Response includes `sessionId` already **active** (computer seated, match started) unless Pie forces `pie_choice` on human.
- If `vsComputer` omitted/false, behavior unchanged (waiting human slot).

## POST `/api/v1/sessions/:id/rematch` (extend)

Body may include `difficulty` override; default = previous session difficulty when rematching a computer session. Rematch of computer session MUST reseat computer (not wait for human).

## POST `/api/v1/sessions/:id/join`

MUST reject (`conflict`) if session `difficulty` is set / seat1 is computer.

## POST `/api/v1/sessions/:id/intent`

Unchanged client contract. After a successful human intent, response `session` snapshot MUST already include any computer follow-up moves (or finished outcome).

## GET snapshot fields

```json
{
  "difficulty": "normal",
  "opponentKind": "computer",
  "seat1": { "telegramUserId": "computer", "joinedAt": "..." }
}
```

Clients MUST NOT send intents with a forged computer identity; only the authenticated human seat may POST intents.
