-- Fase 8: cardio templates + cardio sessions + interval logs
ALTER TYPE "TemplateKind" ADD VALUE IF NOT EXISTS 'CARDIO';

CREATE TABLE "plan_cardio_block" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "day_id" UUID NOT NULL,
  "cardio_method_library_id" UUID,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "display_name" VARCHAR(120) NOT NULL,
  "rounds_planned" INTEGER NOT NULL DEFAULT 1,
  "work_seconds" INTEGER NOT NULL,
  "rest_seconds" INTEGER NOT NULL DEFAULT 0,
  "target_distance_meters" INTEGER,
  "target_rpe" INTEGER,
  "notes" TEXT,
  "archived_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plan_cardio_block_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cardio_field_mode" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "plan_cardio_block_id" UUID NOT NULL,
  "field_key" VARCHAR(80) NOT NULL,
  "mode" "FieldMode" NOT NULL DEFAULT 'COACH_INPUT',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cardio_field_mode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "session_cardio_block" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "session_id" UUID NOT NULL,
  "source_cardio_block_id" UUID,
  "source_cardio_method_id" UUID,
  "display_name" VARCHAR(120) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "rounds_planned" INTEGER NOT NULL DEFAULT 1,
  "work_seconds" INTEGER NOT NULL,
  "rest_seconds" INTEGER NOT NULL DEFAULT 0,
  "target_distance_meters" INTEGER,
  "target_rpe" INTEGER,
  "archived_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "session_cardio_block_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "interval_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "session_id" UUID NOT NULL,
  "session_cardio_block_id" UUID NOT NULL,
  "interval_index" INTEGER NOT NULL,
  "distance_done_meters" INTEGER,
  "duration_seconds_done" INTEGER,
  "effort_rpe" INTEGER,
  "avg_heart_rate" INTEGER,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "interval_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_plan_cardio_day_archived"
ON "plan_cardio_block"("day_id", "archived_at");

CREATE UNIQUE INDEX "uq_cardio_field_mode_item_field"
ON "cardio_field_mode"("plan_cardio_block_id", "field_key");

CREATE INDEX "idx_cardio_field_mode_item"
ON "cardio_field_mode"("plan_cardio_block_id");

CREATE INDEX "idx_session_cardio_session_archived"
ON "session_cardio_block"("session_id", "archived_at");

CREATE UNIQUE INDEX "uq_interval_log_block_interval"
ON "interval_log"("session_cardio_block_id", "interval_index");

CREATE INDEX "idx_interval_log_session"
ON "interval_log"("session_id");

ALTER TABLE "plan_cardio_block"
ADD CONSTRAINT "plan_cardio_block_day_id_fkey"
FOREIGN KEY ("day_id")
REFERENCES "plan_day"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "plan_cardio_block"
ADD CONSTRAINT "plan_cardio_block_cardio_method_library_id_fkey"
FOREIGN KEY ("cardio_method_library_id")
REFERENCES "cardio_method"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "cardio_field_mode"
ADD CONSTRAINT "cardio_field_mode_plan_cardio_block_id_fkey"
FOREIGN KEY ("plan_cardio_block_id")
REFERENCES "plan_cardio_block"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "session_cardio_block"
ADD CONSTRAINT "session_cardio_block_session_id_fkey"
FOREIGN KEY ("session_id")
REFERENCES "session_instance"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "interval_log"
ADD CONSTRAINT "interval_log_session_id_fkey"
FOREIGN KEY ("session_id")
REFERENCES "session_instance"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "interval_log"
ADD CONSTRAINT "interval_log_session_cardio_block_id_fkey"
FOREIGN KEY ("session_cardio_block_id")
REFERENCES "session_cardio_block"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
