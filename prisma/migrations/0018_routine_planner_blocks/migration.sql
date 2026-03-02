-- AlterEnum: Add ROUTINE to TemplateKind
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'TemplateKind'
      AND e.enumlabel = 'ROUTINE'
  ) THEN
    ALTER TYPE "TemplateKind" ADD VALUE 'ROUTINE';
  END IF;
END
$$;
-- CreateTable: plan_plio_block
CREATE TABLE IF NOT EXISTS "plan_plio_block" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "day_id" UUID NOT NULL,
    "plio_exercise_library_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "display_name" VARCHAR(120) NOT NULL,
    "rounds_planned" INTEGER NOT NULL DEFAULT 1,
    "work_seconds" INTEGER NOT NULL,
    "rest_seconds" INTEGER NOT NULL DEFAULT 0,
    "target_rpe" INTEGER,
    "notes" TEXT,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "plan_plio_block_pkey" PRIMARY KEY ("id")
);
-- CreateTable: plan_warmup_block
CREATE TABLE IF NOT EXISTS "plan_warmup_block" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "day_id" UUID NOT NULL,
    "warmup_exercise_library_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "display_name" VARCHAR(120) NOT NULL,
    "rounds_planned" INTEGER NOT NULL DEFAULT 1,
    "work_seconds" INTEGER NOT NULL,
    "rest_seconds" INTEGER NOT NULL DEFAULT 0,
    "target_rpe" INTEGER,
    "notes" TEXT,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "plan_warmup_block_pkey" PRIMARY KEY ("id")
);
-- CreateTable: plan_sport_block
CREATE TABLE IF NOT EXISTS "plan_sport_block" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "day_id" UUID NOT NULL,
    "sport_library_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "display_name" VARCHAR(120) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "target_rpe" INTEGER,
    "notes" TEXT,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "plan_sport_block_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_plan_plio_day_archived" ON "plan_plio_block"("day_id", "archived_at");
CREATE INDEX IF NOT EXISTS "idx_plan_warmup_day_archived" ON "plan_warmup_block"("day_id", "archived_at");
CREATE INDEX IF NOT EXISTS "idx_plan_sport_day_archived" ON "plan_sport_block"("day_id", "archived_at");
-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'plan_plio_block_day_id_fkey'
  ) THEN
    ALTER TABLE "plan_plio_block"
    ADD CONSTRAINT "plan_plio_block_day_id_fkey"
    FOREIGN KEY ("day_id") REFERENCES "plan_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'plan_plio_block_plio_exercise_library_id_fkey'
  ) THEN
    ALTER TABLE "plan_plio_block"
    ADD CONSTRAINT "plan_plio_block_plio_exercise_library_id_fkey"
    FOREIGN KEY ("plio_exercise_library_id") REFERENCES "plio_exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'plan_warmup_block_day_id_fkey'
  ) THEN
    ALTER TABLE "plan_warmup_block"
    ADD CONSTRAINT "plan_warmup_block_day_id_fkey"
    FOREIGN KEY ("day_id") REFERENCES "plan_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'plan_warmup_block_warmup_exercise_library_id_fkey'
  ) THEN
    ALTER TABLE "plan_warmup_block"
    ADD CONSTRAINT "plan_warmup_block_warmup_exercise_library_id_fkey"
    FOREIGN KEY ("warmup_exercise_library_id") REFERENCES "warmup_exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'plan_sport_block_day_id_fkey'
  ) THEN
    ALTER TABLE "plan_sport_block"
    ADD CONSTRAINT "plan_sport_block_day_id_fkey"
    FOREIGN KEY ("day_id") REFERENCES "plan_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'plan_sport_block_sport_library_id_fkey'
  ) THEN
    ALTER TABLE "plan_sport_block"
    ADD CONSTRAINT "plan_sport_block_sport_library_id_fkey"
    FOREIGN KEY ("sport_library_id") REFERENCES "sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
