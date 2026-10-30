-- Additive: custom progression values saved per coach.
CREATE TABLE "coach_preset" (
  "id" UUID NOT NULL,
  "coach_membership_id" UUID NOT NULL,
  "variable" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coach_preset_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "coach_preset_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "uq_coach_preset_value" ON "coach_preset"("coach_membership_id", "variable", "mode", "value");
