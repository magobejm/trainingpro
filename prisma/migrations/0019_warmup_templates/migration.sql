CREATE TABLE "warmup_template" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scope" "LibraryItemScope" NOT NULL DEFAULT 'COACH',
  "organization_id" UUID,
  "coach_membership_id" UUID,
  "name" VARCHAR(120) NOT NULL,
  "template_version" INTEGER NOT NULL DEFAULT 1,
  "archived_at" TIMESTAMPTZ(6),
  "created_by" UUID,
  "updated_by" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "warmup_template_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "warmup_template_item" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "template_id" UUID NOT NULL,
  "block_type" VARCHAR(20) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "display_name" VARCHAR(120) NOT NULL,
  "exercise_library_id" UUID,
  "cardio_method_library_id" UUID,
  "plio_exercise_library_id" UUID,
  "warmup_exercise_library_id" UUID,
  "sets_planned" INTEGER,
  "reps_min" INTEGER,
  "reps_max" INTEGER,
  "rounds_planned" INTEGER,
  "work_seconds" INTEGER,
  "rest_seconds" INTEGER,
  "target_rpe" INTEGER,
  "target_rir" INTEGER,
  "duration_minutes" INTEGER,
  "notes" TEXT,
  "metadata_json" JSONB,
  "archived_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "warmup_template_item_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_warmup_template_scope_archived" ON "warmup_template" ("scope", "archived_at");
CREATE INDEX "idx_warmup_template_coach_archived" ON "warmup_template" ("coach_membership_id", "archived_at");
CREATE INDEX "idx_warmup_template_org_archived" ON "warmup_template" ("organization_id", "archived_at");
CREATE INDEX "idx_warmup_template_item_template_archived" ON "warmup_template_item" ("template_id", "archived_at");

ALTER TABLE "warmup_template"
ADD CONSTRAINT "warmup_template_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "warmup_template"
ADD CONSTRAINT "warmup_template_coach_membership_id_fkey"
FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "warmup_template_item"
ADD CONSTRAINT "warmup_template_item_template_id_fkey"
FOREIGN KEY ("template_id") REFERENCES "warmup_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "warmup_template_item"
ADD CONSTRAINT "warmup_template_item_exercise_library_id_fkey"
FOREIGN KEY ("exercise_library_id") REFERENCES "exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "warmup_template_item"
ADD CONSTRAINT "warmup_template_item_cardio_method_library_id_fkey"
FOREIGN KEY ("cardio_method_library_id") REFERENCES "cardio_method"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "warmup_template_item"
ADD CONSTRAINT "warmup_template_item_plio_exercise_library_id_fkey"
FOREIGN KEY ("plio_exercise_library_id") REFERENCES "plio_exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "warmup_template_item"
ADD CONSTRAINT "warmup_template_item_warmup_exercise_library_id_fkey"
FOREIGN KEY ("warmup_exercise_library_id") REFERENCES "warmup_exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
