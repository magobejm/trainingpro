-- Fase 11: weekly reports
CREATE TABLE "weekly_report" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "coach_membership_id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "week_start_date" DATE NOT NULL,
  "report_date" DATE NOT NULL,
  "source_session_id" UUID,
  "mood" INTEGER,
  "energy" INTEGER,
  "sleep_hours" DECIMAL(4,2),
  "adherence_percent" INTEGER,
  "notes" TEXT,
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "weekly_report_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_weekly_report_client_week"
ON "weekly_report"("client_id", "week_start_date");

CREATE INDEX "idx_weekly_report_coach_week"
ON "weekly_report"("coach_membership_id", "week_start_date");

CREATE INDEX "idx_weekly_report_client_report_date"
ON "weekly_report"("client_id", "report_date");

ALTER TABLE "weekly_report"
ADD CONSTRAINT "weekly_report_organization_id_fkey"
FOREIGN KEY ("organization_id")
REFERENCES "organization"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "weekly_report"
ADD CONSTRAINT "weekly_report_coach_membership_id_fkey"
FOREIGN KEY ("coach_membership_id")
REFERENCES "organization_member"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "weekly_report"
ADD CONSTRAINT "weekly_report_client_id_fkey"
FOREIGN KEY ("client_id")
REFERENCES "client"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "weekly_report"
ADD CONSTRAINT "weekly_report_source_session_id_fkey"
FOREIGN KEY ("source_session_id")
REFERENCES "session_instance"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
