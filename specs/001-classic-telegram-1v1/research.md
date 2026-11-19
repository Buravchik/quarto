# Research: 001-classic-telegram-1v1

## R1 — Language & Telegram stack

- **Decision**: TypeScript + Node 22; Telegraf bot; Next.js static Mini App (React).
- **Rationale**: Matches the approved Sudoku architecture reference; one language across bot, API, and UI; strong Telegram ecosystem.
- **Alternatives considered**: Python/aiogram (fine, but splits stack from Mini App TS); grammY (also fine; Telegraf chosen for Sudoku familiarity).

## R2 — Who owns game state

- **Decision**: Server-authoritative state machine in `src/quarto`. Mini App sends intents (`place`, `give`, `declare`, `pieChoice`, `resign`, `claimTimeout`). Bot never computes win/lose itself beyond calling the engine.
- **Rationale**: Constitution IV + VI; async 1v1 cannot trust client board.
- **Alternatives considered**: Client-side rules with server echo (Sudoku-like) — rejected for multiplayer integrity.

## R3 — Persistence

- **Decision**: **Supabase Free** (hosted Postgres). Bot/API uses Drizzle ORM + `pg` over `DATABASE_URL`. Schema is plain Postgres from day one.
- **Rationale**: Concurrent 1v1 sessions, claimable timeouts, and achievements need a real shared DB; free hosted Postgres avoids local SQLite files and multi-instance pain. Matches product expectation better than a single-file MVP.
- **Alternatives considered**: SQLite (single-container) — rejected (weak for concurrent writes / ops credibility); JSON files (Sudoku default) — weaker still; Neon/other Postgres hosts — acceptable equivalents if Supabase Free limits bite; Firestore — heavier ops for v1.
- **Notes**: Stay on Free tier for v1; watch pause-after-inactivity and connection limits; keep PII minimal (Telegram user id + name snapshot). Optional Supabase Realtime later — not required for v1 (bot push + Mini App refresh).

## R4 — Bot update delivery

- **Decision**: Long polling for local/dev; **webhook on Cloud Run** in production (same host pattern as Sudoku: container + `WEBHOOK_URL` → `POST /telegram`). Mini App API shares that Node HTTP server.
- **Rationale**: Stable public HTTPS without ephemeral tunnels; Telegraf standard path.
- **Alternatives considered**: Polling-only in production — brittle; ad-hoc tunnels (trycloudflare / Tailscale Funnel) — not used; they are ephemeral and were never part of the plan.

## R5 — Mini App hosting

- **Decision**: Static export of Next Mini App to **GitHub Pages**; `TELEGRAM_WEBAPP_URL` / menu button point at that origin; `NEXT_PUBLIC_API_BASE` points at the Cloud Run service URL.
- **Rationale**: Same as Sudoku; cheap HTTPS for Telegram WebApp requirement.
- **Alternatives considered**: Serving Mini App from the bot origin — couples deploys; acceptable fallback if Pages unavailable.

## R6 — AuthN for Mini App writes

- **Decision**: Validate Telegram WebApp `initData` HMAC with bot token on every mutating request; bind actions to `user.id` and seated role.
- **Rationale**: Constitution IV; Telegram-recommended approach.
- **Alternatives considered**: Trust client-sent user id — rejected.

## R7 — Miss / Pie implementation locus

- **Decision**: Encode Miss Void/Persistent and Pie Rule inside `src/quarto` session config + transition guards; Telegram only surfaces checkboxes before lock.
- **Rationale**: Rules testable without bot; settings lock on join is a session lifecycle rule in the engine/API layer.
- **Alternatives considered**: Soft UI-only flags — rejected.

## R8 — Timeout claim

- **Decision**: Store `turnNotifiedAt`; after 24h expose `claimTimeout` intent to the waiting seat only; no cron auto-end required for correctness (optional reminder job later).
- **Rationale**: Clarify A — explicit claim button.
- **Alternatives considered**: Auto-end job — deferred unless product asks.

## R9 — Mode modules hook

- **Decision**: Engine exposes a **module registry** (`GameModule`: traits/pieces, **BoardLayout** (cell ids, shape, win masks), pick model, optional intent extensions). Session stores opaque cell→piece occupancy only. v1 registers only `classic4` (4×4, 16 pieces). Later packs may replace the board entirely (size/shape/win sets) without rewriting Telegram shell. Conflict groups enforced when activating modules (later specs / catalog).
- **Rationale**: Spec FR-019; board is rule-owned, same as pieces.
- **Alternatives considered**: Hard-code 4×4 forever — blocks catalog layouts.

## R10 — i18n

- **Decision**: RU + EN string tables; language from Telegram `language_code` with manual toggle in Mini App.
- **Rationale**: Spec FR-018.
- **Alternatives considered**: EN-only MVP — rejected by spec.
