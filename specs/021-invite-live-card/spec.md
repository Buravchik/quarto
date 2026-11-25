# Feature Specification: Invite → this game, one live card, iPhone fit

**Feature Branch**: `cursor/021-invite-live-card` (feature id `021-invite-live-card`)

**Created**: 2026-11-25

**Status**: Implemented (awaiting owner smoke + deploy)

## Problems (from owner reports)

1. **iPhone: game screen cut on the right** (menu fine). Root cause: the game `<section>` was a
   grid with an implicit `auto` column. The waiting row (nowrap headline + `?` + share + new match)
   has a min-content wider than 320–430 px, so the column and everything in it (board, pool) grew
   past the screen and `overflow-x: clip` cut it.
2. **Invite from a group did not lead into the game.** Four causes:
   - Mini App took `?sessionId` (stale, from the vs-computer game) before `start_param` (invite);
   - inline card stayed on «preparing challenge card…» with a session-less button;
   - group links open the bot DM when no Mini App short name / Main Mini App is configured;
   - each move sent a new «Your turn» DM instead of updating the card; card had no chat name.

## Requirements

- **FR-001** No horizontal overflow on the game screen at 320–430 px (`npm run smoke:layout`).
  `disableVerticalSwipes()` on boot; `overscroll-behavior: none`.
- **FR-002** Share = `savePreparedInlineMessage` (server, `POST /api/v1/sessions/:id/share`) +
  `WebApp.shareMessage` (client, prepared ahead of the tap). Result id `s:<sessionId>`; the message
  IS the live card of this session with a `startapp=<sessionId>` Join button. No placeholders.
- **FR-003** Fallback: `switchInlineQuery(<sessionId>, ["users","groups"])` → inline answer with
  the same card. Empty inline query → user's open invites (or one fresh card). No placeholders.
- **FR-004** `inline_message_id` saved from `chosen_inline_result` (best effort, needs inline
  feedback) **and** from the 🔄 callback on the card (`r:<sessionId>`) as a fallback.
- **FR-005** Launch: fresh `start_param` > `?sessionId` (consumed once per launch so rematch /
  in-app navigation still works).
- **FR-006** Invite screen: «{name} зовёт тебя в Кварто», chat title, big **Join**; if the viewer has
  another live game — «Вернуться к своей партии».
- **FR-007** One live card per game: `editMessageText` for inline + chat copies, coalesced per card
  (≥1.2 s), 429 `retry_after` honoured, «message is not modified» ignored. Card shows inviter + chat.
- **FR-008** DMs: vs computer → 0 (incl. no lobby card DM). PvP → at most one status DM per seat per
  session; a new (notifying) message only when that player needs to act and is not in the Mini App
  (presence from polling, 25 s window); otherwise the existing DM is edited silently.
- **FR-009** Startup warning when `TELEGRAM_MINI_APP_SHORT_NAME` is empty.
- **FR-010** initData `auth_date` ≤ 24 h (`INIT_DATA_MAX_AGE_SEC` override) → `401 expired_init_data`.
- **FR-011** P0 native basics: BackButton (game → lobby), HapticFeedback, theme sync
  (`themeChanged`, header/background colours), closing confirmation in an active PvP game,
  refresh on `activated` / `visibilitychange`.

## Data

Migration `supabase/migrations/20261125160000_live_card_invites.sql` (mirrored in
`db/migrations/0003_live_card_invites.sql`, idempotent): `cards.chat_title`,
`sessions.dm_messages jsonb`, `sessions.presence jsonb`, partial index for open invites.
**Apply before deploying the bot** (the bot selects these columns).

## Out of scope

Realtime transport, ratings, tournaments, Stars, fullscreen.
