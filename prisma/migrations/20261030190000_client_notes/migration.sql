-- Existing incidents migrate to OTHER through the column default. Notes are a new table.
CREATE TYPE "FeedbackCategory" AS ENUM ('EXERCISE', 'OTHER');
ALTER TABLE "incident" ADD COLUMN "category" "FeedbackCategory" NOT NULL DEFAULT 'OTHER';

CREATE TABLE "client_note" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "coach_membership_id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "session_id" UUID,
  "session_item_id" UUID,
  "exercise_library_id" UUID,
  "exercise_name" VARCHAR(120),
  "text" TEXT NOT NULL,
  "category" "FeedbackCategory" NOT NULL,
  "archived_at" TIMESTAMPTZ(6),
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_note_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "client_note_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "client_note_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "client_note_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "client_note_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "client_note_session_item_id_fkey" FOREIGN KEY ("session_item_id") REFERENCES "session_strength_item"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "idx_client_note_client_created" ON "client_note"("client_id", "created_at");
CREATE INDEX "idx_client_note_coach_created" ON "client_note"("coach_membership_id", "created_at");
