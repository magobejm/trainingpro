-- T28-T30 clients model with ownership, soft-delete, audit fields
CREATE TABLE "client" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "coach_membership_id" UUID NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "first_name" VARCHAR(80) NOT NULL,
  "last_name" VARCHAR(80) NOT NULL,
  "objective" VARCHAR(200),
  "notes" TEXT,
  "phone" VARCHAR(30),
  "sex" VARCHAR(30),
  "birth_date" DATE,
  "height_cm" INTEGER,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "archived_by" UUID,
  "archived_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_client_organization" FOREIGN KEY ("organization_id")
    REFERENCES "organization"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_client_coach_membership" FOREIGN KEY ("coach_membership_id")
    REFERENCES "organization_member"("id") ON DELETE RESTRICT
);

CREATE INDEX "idx_client_org_archived" ON "client" ("organization_id", "archived_at");
CREATE INDEX "idx_client_coach_archived" ON "client" ("coach_membership_id", "archived_at");
CREATE INDEX "idx_client_email" ON "client" ("email");
