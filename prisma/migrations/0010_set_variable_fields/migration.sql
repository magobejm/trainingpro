-- Migration 0010: per-set variables for cardio, plio, mobility and sport

ALTER TABLE "plan_cardio_set"
  ADD COLUMN IF NOT EXISTS "duration_seconds" INTEGER,
  ADD COLUMN IF NOT EXISTS "rest_seconds" INTEGER;

ALTER TABLE "plan_plio_set"
  ADD COLUMN IF NOT EXISTS "duration_seconds" INTEGER;

ALTER TABLE "plan_mobility_set"
  ADD COLUMN IF NOT EXISTS "weight_kg" DECIMAL(6, 2);

ALTER TABLE "plan_sport_set"
  ADD COLUMN IF NOT EXISTS "duration_seconds" INTEGER,
  ADD COLUMN IF NOT EXISTS "rom" VARCHAR(30);
