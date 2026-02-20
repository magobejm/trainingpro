-- Fase 7: sesiones de pesas (snapshot + set logs)
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE "session_instance" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "coach_membership_id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "source_template_id" UUID NOT NULL,
  "source_template_version" INTEGER NOT NULL,
  "session_date" DATE NOT NULL,
  "started_at" TIMESTAMPTZ(6),
  "finished_at" TIMESTAMPTZ(6),
  "is_completed" BOOLEAN NOT NULL DEFAULT false,
  "is_incomplete" BOOLEAN NOT NULL DEFAULT false,
  "finish_comment" TEXT,
  "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
  "archived_at" TIMESTAMPTZ(6),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "session_instance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "session_strength_item" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "session_id" UUID NOT NULL,
  "source_exercise_id" UUID,
  "display_name" VARCHAR(120) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "sets_planned" INTEGER,
  "reps_min" INTEGER,
  "reps_max" INTEGER,
  "weight_range_min_kg" DECIMAL(6,2),
  "weight_range_max_kg" DECIMAL(6,2),
  "per_set_ranges_json" JSONB,
  "archived_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "session_strength_item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "set_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "session_id" UUID NOT NULL,
  "session_item_id" UUID NOT NULL,
  "set_index" INTEGER NOT NULL,
  "reps_done" INTEGER,
  "weight_done_kg" DECIMAL(6,2),
  "effort_rpe" INTEGER,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "set_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_session_client_date"
ON "session_instance"("client_id", "session_date");

CREATE UNIQUE INDEX "uq_set_log_item_set"
ON "set_log"("session_item_id", "set_index");

CREATE INDEX "idx_session_coach_date"
ON "session_instance"("coach_membership_id", "session_date");

CREATE INDEX "idx_session_org_date"
ON "session_instance"("organization_id", "session_date");

CREATE INDEX "idx_session_item_session_archived"
ON "session_strength_item"("session_id", "archived_at");

CREATE INDEX "idx_set_log_session"
ON "set_log"("session_id");

ALTER TABLE "session_instance"
ADD CONSTRAINT "session_instance_client_id_fkey"
FOREIGN KEY ("client_id")
REFERENCES "client"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "session_instance"
ADD CONSTRAINT "session_instance_organization_id_fkey"
FOREIGN KEY ("organization_id")
REFERENCES "organization"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "session_instance"
ADD CONSTRAINT "session_instance_coach_membership_id_fkey"
FOREIGN KEY ("coach_membership_id")
REFERENCES "organization_member"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "session_instance"
ADD CONSTRAINT "session_instance_source_template_id_fkey"
FOREIGN KEY ("source_template_id")
REFERENCES "plan_template"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "session_strength_item"
ADD CONSTRAINT "session_strength_item_session_id_fkey"
FOREIGN KEY ("session_id")
REFERENCES "session_instance"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "session_strength_item"
ADD CONSTRAINT "session_strength_item_source_exercise_id_fkey"
FOREIGN KEY ("source_exercise_id")
REFERENCES "exercise"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "set_log"
ADD CONSTRAINT "set_log_session_id_fkey"
FOREIGN KEY ("session_id")
REFERENCES "session_instance"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "set_log"
ADD CONSTRAINT "set_log_session_item_id_fkey"
FOREIGN KEY ("session_item_id")
REFERENCES "session_strength_item"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
