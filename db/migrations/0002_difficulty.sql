-- 016 vs-computer: session difficulty (null = human opponent)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS difficulty varchar(16);
