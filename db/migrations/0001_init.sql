CREATE TABLE IF NOT EXISTS players (
  telegram_user_id varchar(32) PRIMARY KEY,
  display_name text NOT NULL DEFAULT '',
  language varchar(8) NOT NULL DEFAULT 'en',
  achievement_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  pinned_achievement_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cards (
  card_id varchar(64) PRIMARY KEY,
  owner_telegram_user_id varchar(32) NOT NULL,
  surface varchar(8) NOT NULL,
  chat_id varchar(64),
  message_id integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id varchar(64) PRIMARY KEY,
  card_id varchar(64) NOT NULL REFERENCES cards(card_id),
  status varchar(16) NOT NULL DEFAULT 'waiting',
  miss_mode varchar(16) NOT NULL DEFAULT 'persistent',
  pie_rule boolean NOT NULL DEFAULT false,
  modules jsonb NOT NULL DEFAULT '["classic4"]'::jsonb,
  settings_locked boolean NOT NULL DEFAULT false,
  seat0 jsonb,
  seat1 jsonb,
  opener_seat integer,
  turn_seat integer,
  phase varchar(32) NOT NULL DEFAULT 'waiting',
  board jsonb NOT NULL,
  pool jsonb NOT NULL,
  piece_in_hand varchar(32),
  voided_sets jsonb NOT NULL DEFAULT '[]'::jsonb,
  turn_notified_at timestamptz,
  outcome jsonb,
  rematch_of_session_id varchar(64),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_card_id_idx ON sessions(card_id);
