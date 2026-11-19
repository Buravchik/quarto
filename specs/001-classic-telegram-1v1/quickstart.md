# Quickstart validation: 001-classic-telegram-1v1

Prove the feature without implementing every UI polish item. Use two Telegram test accounts + local bot.

## Prerequisites

- Node 22+, npm/pnpm
- Bot token in env (`BOT_TOKEN`); Mini App URL HTTPS (`TELEGRAM_WEBAPP_URL`)
- SQLite path writable (`DATABASE_PATH`)
- Spec artifacts: [spec.md](./spec.md), [data-model.md](./data-model.md), [contracts/miniapp-api.md](./contracts/miniapp-api.md)

## Setup (after implement)

```bash
cd <repo-root>
cp .env.example .env   # fill BOT_TOKEN, TELEGRAM_WEBAPP_URL, DATABASE_PATH
npm install
npm run test           # unit: src/quarto must pass without Telegram
npm run bot:start      # API + Telegraf
npm run dev            # or build+export Mini App to the configured URL
```

## Scenario A — Classic win (P1)

1. User A: `/start` or create-card command → challenge card appears.
2. User A opens Mini App, creates/waits on slot (Miss OFF, Pie OFF).
3. User B opens same card → joins (settings lock).
4. Play give → place → … until a legal Quarto; A or B declares with four cells.
5. **Expect**: match finished win; card status updates; both get `match_ended` notification.
6. Close Mini App, reopen → finished state still shown (no resume into moves).

## Scenario B — Illegal declare

1. Mid-game, player presses Quarto on a non-winning set.
2. **Expect**: `400 illegal_declare`; board unchanged; turn unchanged.

## Scenario C — Void miss

1. New slot: Miss ON (void). Creator sets before B joins.
2. Create a line and skip declare; hand off; B claims before place through that cell → B wins.
3. Or B places without claiming → that set cannot win later.

## Scenario D — Persistent late claim

1. Miss OFF. Skip a set; later place a piece on that set and declare after place.
2. **Expect**: win allowed; declare before place / on receive alone → rejected.

## Scenario E — Timeout claim

1. Stall >24h on a turn (or inject `turnNotifiedAt` in test harness).
2. Waiting player sees claim control; presses it.
3. **Expect**: timeout win; without press, match still active.

## Scenario F — Slot cap & rematch

1. Fill 8 slots on one card → 9th create returns `slot_cap`.
2. Finish one match → rematch offer/accept → new session on same card with same Miss/Pie.

## Scenario G — Achievements

1. Complete first match / first Quarto / draw / rematch / host / pie-win paths.
2. Pin two icons; third pin rejected.
3. Card shows pinned icons by name.

## Automated gate

```bash
npm run test           # engine: lines, void/persistent windows, pie, illegal declare
npm run test:contract  # initData reject; seat isolation; slot cap
```

Engine tests MUST run with Telegram modules mocked or absent.
