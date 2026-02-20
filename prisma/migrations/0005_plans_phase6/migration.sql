-- Fase 6: plan templates de pesas + field modes
CREATE TYPE "TemplateKind" AS ENUM ('STRENGTH');
CREATE TYPE "FieldMode" AS ENUM ('HIDDEN', 'COACH_INPUT', 'CLIENT_INPUT');

CREATE TABLE "plan_template" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "coach_membership_id" UUID NOT NULL,
  "kind" "TemplateKind" NOT NULL DEFAULT 'STRENGTH',
  "name" VARCHAR(120) NOT NULL,
  "template_version" INTEGER NOT NULL DEFAULT 1,
  "archived_at" TIMESTAMPTZ(6),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plan_template_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_day" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "template_id" UUID NOT NULL,
  "day_index" INTEGER NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "archived_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plan_day_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_strength_exercise" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "day_id" UUID NOT NULL,
  "exercise_library_id" UUID,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "display_name" VARCHAR(120) NOT NULL,
  "sets_planned" INTEGER,
  "reps_min" INTEGER,
  "reps_max" INTEGER,
  "weight_range_min_kg" DECIMAL(6,2),
  "weight_range_max_kg" DECIMAL(6,2),
  "per_set_weight_ranges_json" JSONB,
  "notes" TEXT,
  "archived_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "plan_strength_exercise_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_mode" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "plan_strength_exercise_id" UUID NOT NULL,
  "field_key" VARCHAR(80) NOT NULL,
  "mode" "FieldMode" NOT NULL DEFAULT 'COACH_INPUT',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "field_mode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_plan_day_template_index"
ON "plan_day"("template_id", "day_index");

CREATE UNIQUE INDEX "uq_field_mode_item_field"
ON "field_mode"("plan_strength_exercise_id", "field_key");

CREATE INDEX "idx_plan_template_coach_archived"
ON "plan_template"("coach_membership_id", "archived_at");

CREATE INDEX "idx_plan_template_org_archived"
ON "plan_template"("organization_id", "archived_at");

CREATE INDEX "idx_plan_day_template_archived"
ON "plan_day"("template_id", "archived_at");

CREATE INDEX "idx_plan_strength_day_archived"
ON "plan_strength_exercise"("day_id", "archived_at");

CREATE INDEX "idx_field_mode_item"
ON "field_mode"("plan_strength_exercise_id");

ALTER TABLE "plan_template"
ADD CONSTRAINT "plan_template_organization_id_fkey"
FOREIGN KEY ("organization_id")
REFERENCES "organization"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "plan_template"
ADD CONSTRAINT "plan_template_coach_membership_id_fkey"
FOREIGN KEY ("coach_membership_id")
REFERENCES "organization_member"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "plan_day"
ADD CONSTRAINT "plan_day_template_id_fkey"
FOREIGN KEY ("template_id")
REFERENCES "plan_template"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "plan_strength_exercise"
ADD CONSTRAINT "plan_strength_exercise_day_id_fkey"
FOREIGN KEY ("day_id")
REFERENCES "plan_day"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "plan_strength_exercise"
ADD CONSTRAINT "plan_strength_exercise_exercise_library_id_fkey"
FOREIGN KEY ("exercise_library_id")
REFERENCES "exercise"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "field_mode"
ADD CONSTRAINT "field_mode_plan_strength_exercise_id_fkey"
FOREIGN KEY ("plan_strength_exercise_id")
REFERENCES "plan_strength_exercise"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
