-- Migration 0011: session set-log fields, sport per-set logs, sport youtube url

ALTER TABLE "plio_set_log"
  ADD COLUMN IF NOT EXISTS "duration_seconds_done" INTEGER;

ALTER TABLE "mobility_set_log"
  ADD COLUMN IF NOT EXISTS "weight_done_kg" DECIMAL(6, 2);

ALTER TABLE "interval_log"
  ADD COLUMN IF NOT EXISTS "rest_seconds_done" INTEGER;

ALTER TABLE "sport"
  ADD COLUMN IF NOT EXISTS "youtube_url" VARCHAR(500);

CREATE TABLE IF NOT EXISTS "sport_set_log" (
  "id" UUID NOT NULL,
  "session_id" UUID NOT NULL,
  "session_sport_block_id" UUID NOT NULL,
  "set_index" INTEGER NOT NULL,
  "reps_done" INTEGER,
  "weight_done_kg" DECIMAL(6, 2),
  "effort_rpe" INTEGER,
  "hr_max_pct_done" INTEGER,
  "duration_seconds_done" INTEGER,
  "heart_rate_done" INTEGER,
  "effort_rir" INTEGER,
  "hr_reserve_pct_done" INTEGER,
  "rom_done" VARCHAR(30),
  "rest_seconds_done" INTEGER,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "sport_set_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_sport_set_log_block_set"
  ON "sport_set_log"("session_sport_block_id", "set_index");

CREATE INDEX IF NOT EXISTS "idx_sport_set_log_session"
  ON "sport_set_log"("session_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sport_set_log_session_id_fkey'
  ) THEN
    ALTER TABLE "sport_set_log"
      ADD CONSTRAINT "sport_set_log_session_id_fkey"
      FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sport_set_log_session_sport_block_id_fkey'
  ) THEN
    ALTER TABLE "sport_set_log"
      ADD CONSTRAINT "sport_set_log_session_sport_block_id_fkey"
      FOREIGN KEY ("session_sport_block_id") REFERENCES "session_sport_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
