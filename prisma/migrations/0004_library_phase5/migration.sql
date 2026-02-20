-- Fase 5: biblioteca global + biblioteca por coach
CREATE TYPE "LibraryItemScope" AS ENUM ('GLOBAL', 'COACH');

CREATE TABLE "exercise" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scope" "LibraryItemScope" NOT NULL,
  "organization_id" UUID,
  "coach_membership_id" UUID,
  "name" VARCHAR(120) NOT NULL,
  "muscle_group" VARCHAR(80) NOT NULL,
  "equipment" VARCHAR(80),
  "instructions" TEXT,
  "media_url" VARCHAR(500),
  "media_type" VARCHAR(40),
  "created_by" UUID,
  "updated_by" UUID,
  "archived_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exercise_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cardio_method" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scope" "LibraryItemScope" NOT NULL,
  "organization_id" UUID,
  "coach_membership_id" UUID,
  "name" VARCHAR(120) NOT NULL,
  "method_type" VARCHAR(80) NOT NULL,
  "description" TEXT,
  "media_url" VARCHAR(500),
  "media_type" VARCHAR(40),
  "created_by" UUID,
  "updated_by" UUID,
  "archived_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cardio_method_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scope" "LibraryItemScope" NOT NULL,
  "organization_id" UUID,
  "coach_membership_id" UUID,
  "name" VARCHAR(120) NOT NULL,
  "serving_unit" VARCHAR(40),
  "calories_kcal" INTEGER,
  "protein_g" INTEGER,
  "carbs_g" INTEGER,
  "fat_g" INTEGER,
  "notes" TEXT,
  "media_url" VARCHAR(500),
  "media_type" VARCHAR(40),
  "created_by" UUID,
  "updated_by" UUID,
  "archived_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "food_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_exercise_scope_archived"
ON "exercise"("scope", "archived_at");

CREATE INDEX "idx_exercise_coach_archived"
ON "exercise"("coach_membership_id", "archived_at");

CREATE INDEX "idx_cardio_scope_archived"
ON "cardio_method"("scope", "archived_at");

CREATE INDEX "idx_cardio_coach_archived"
ON "cardio_method"("coach_membership_id", "archived_at");

CREATE INDEX "idx_food_scope_archived"
ON "food"("scope", "archived_at");

CREATE INDEX "idx_food_coach_archived"
ON "food"("coach_membership_id", "archived_at");

ALTER TABLE "exercise"
ADD CONSTRAINT "exercise_organization_id_fkey"
FOREIGN KEY ("organization_id")
REFERENCES "organization"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "exercise"
ADD CONSTRAINT "exercise_coach_membership_id_fkey"
FOREIGN KEY ("coach_membership_id")
REFERENCES "organization_member"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "cardio_method"
ADD CONSTRAINT "cardio_method_organization_id_fkey"
FOREIGN KEY ("organization_id")
REFERENCES "organization"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "cardio_method"
ADD CONSTRAINT "cardio_method_coach_membership_id_fkey"
FOREIGN KEY ("coach_membership_id")
REFERENCES "organization_member"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "food"
ADD CONSTRAINT "food_organization_id_fkey"
FOREIGN KEY ("organization_id")
REFERENCES "organization"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "food"
ADD CONSTRAINT "food_coach_membership_id_fkey"
FOREIGN KEY ("coach_membership_id")
REFERENCES "organization_member"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
