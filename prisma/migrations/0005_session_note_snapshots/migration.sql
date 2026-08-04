-- Migration 0005: snapshot coach instructions, trainer notes and planned sets on session blocks

ALTER TABLE "session_strength_item"
  ADD COLUMN "coach_instructions" TEXT,
  ADD COLUMN "planned_sets_json" JSONB;

ALTER TABLE "session_cardio_block"
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "coach_instructions" TEXT,
  ADD COLUMN "planned_sets_json" JSONB;

ALTER TABLE "session_plio_block"
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "coach_instructions" TEXT,
  ADD COLUMN "planned_sets_json" JSONB;

ALTER TABLE "session_mobility_block"
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "coach_instructions" TEXT,
  ADD COLUMN "planned_sets_json" JSONB;

ALTER TABLE "session_isometric_block"
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "coach_instructions" TEXT,
  ADD COLUMN "planned_sets_json" JSONB;

ALTER TABLE "session_sport_block"
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "coach_instructions" TEXT,
  ADD COLUMN "planned_sets_json" JSONB;
