-- 021 invite + live card: group title on cards, one editable DM per seat, Mini App presence.
ALTER TABLE cards ADD COLUMN IF NOT EXISTS chat_title text;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS dm_messages jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS presence jsonb NOT NULL DEFAULT '{}'::jsonb;
-- difficulty lives in db/migrations/0002; repeat idempotently so the partial index below always applies.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS difficulty varchar(16);
CREATE INDEX IF NOT EXISTS sessions_seat0_waiting_idx
  ON sessions ((seat0->>'telegramUserId'))
  WHERE status = 'waiting' AND difficulty IS NULL;
