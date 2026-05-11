-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "SessionStartMode" AS ENUM ('TIMER', 'INTERACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable: session_instance wellness + start_mode columns
ALTER TABLE "session_instance"
  ADD COLUMN IF NOT EXISTS "post_fatigue" INTEGER,
  ADD COLUMN IF NOT EXISTS "post_mood" INTEGER,
  ADD COLUMN IF NOT EXISTS "post_pain" INTEGER,
  ADD COLUMN IF NOT EXISTS "pre_fatigue" INTEGER,
  ADD COLUMN IF NOT EXISTS "pre_motivation" INTEGER,
  ADD COLUMN IF NOT EXISTS "pre_recovery" INTEGER,
  ADD COLUMN IF NOT EXISTS "start_mode" "SessionStartMode";

-- AlterTable: session_strength_item template snapshot columns
ALTER TABLE "session_strength_item"
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "rest_seconds" INTEGER,
  ADD COLUMN IF NOT EXISTS "target_rir" INTEGER,
  ADD COLUMN IF NOT EXISTS "target_rpe" INTEGER;

-- AlterTable: set_log effort_rir column
ALTER TABLE "set_log" ADD COLUMN IF NOT EXISTS "effort_rir" INTEGER;
