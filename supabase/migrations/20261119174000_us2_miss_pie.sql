ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_placed_cell integer;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS first_place_done boolean NOT NULL DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS pie_resolved boolean NOT NULL DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS void_claim_open boolean NOT NULL DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS pending_void_sets jsonb NOT NULL DEFAULT '[]'::jsonb;
