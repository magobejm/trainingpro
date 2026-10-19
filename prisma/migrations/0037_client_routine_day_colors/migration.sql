-- Additive preference table. Existing clients, plans, events and sessions are untouched.
CREATE TABLE "client_routine_day_color" (
  "client_id" UUID NOT NULL,
  "plan_day_id" UUID NOT NULL,
  "color" VARCHAR(7) NOT NULL CHECK ("color" ~ '^#[0-9a-fA-F]{6}$'),
  CONSTRAINT "client_routine_day_color_pkey" PRIMARY KEY ("client_id", "plan_day_id"),
  CONSTRAINT "client_routine_day_color_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "client_routine_day_color_plan_day_id_fkey" FOREIGN KEY ("plan_day_id") REFERENCES "plan_day"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "client_routine_day_color_plan_day_id_idx" ON "client_routine_day_color"("plan_day_id");
