-- Snapshot of plan day on session (survives PlanDay deletion via FK SetNull; index/title remain)
ALTER TABLE "session_instance" ADD COLUMN "plan_day_id" UUID;
ALTER TABLE "session_instance" ADD COLUMN "plan_day_index" INTEGER;
ALTER TABLE "session_instance" ADD COLUMN "plan_day_title" VARCHAR(120);

ALTER TABLE "session_instance"
  ADD CONSTRAINT "session_instance_plan_day_id_fkey"
  FOREIGN KEY ("plan_day_id") REFERENCES "plan_day"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "idx_session_instance_plan_day" ON "session_instance"("plan_day_id");
CREATE INDEX "idx_session_instance_template_plan_day_index" ON "session_instance"("source_template_id", "plan_day_index");

-- Backfill from calendar events + plan_day snapshot
UPDATE "session_instance" si
SET
  "plan_day_id" = ce."plan_day_id",
  "plan_day_index" = pd."day_index",
  "plan_day_title" = pd."title"
FROM "calendar_event" ce
INNER JOIN "plan_day" pd ON pd."id" = ce."plan_day_id"
WHERE si."client_id" = ce."client_id"
  AND si."session_date" = ce."date"
  AND ce."plan_day_id" IS NOT NULL
  AND si."plan_day_id" IS NULL;
