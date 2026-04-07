CREATE TABLE "calendar_event" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "coach_membership_id" UUID NOT NULL,
  "client_id" UUID,
  "type" VARCHAR(20) NOT NULL,
  "date" DATE NOT NULL,
  "title" VARCHAR(200),
  "content" TEXT,
  "time" VARCHAR(5),
  "color" VARCHAR(30),
  "plan_day_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archived_at" TIMESTAMPTZ(6),

  CONSTRAINT "calendar_event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_calendar_event_coach_date" ON "calendar_event"("coach_membership_id", "date");
CREATE INDEX "idx_calendar_event_client_date" ON "calendar_event"("client_id", "date");

ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_coach_membership_id_fkey"
  FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_plan_day_id_fkey"
  FOREIGN KEY ("plan_day_id") REFERENCES "plan_day"("id") ON DELETE SET NULL ON UPDATE CASCADE;
