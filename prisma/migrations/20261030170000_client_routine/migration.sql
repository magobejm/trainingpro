-- Additive: per-client routine copies. Existing templates, clients and sessions are untouched.
ALTER TABLE "plan_template" ADD COLUMN "owner_client_id" UUID;
CREATE INDEX "idx_plan_template_owner_client" ON "plan_template"("owner_client_id");
ALTER TABLE "plan_template"
  ADD CONSTRAINT "plan_template_owner_client_id_fkey" FOREIGN KEY ("owner_client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "client_routine" (
  "id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "source_template_id" UUID NOT NULL,
  "source_template_version" INTEGER NOT NULL,
  "base_template_id" UUID NOT NULL,
  "cycle_starts_on" DATE NOT NULL,
  "cycle_days" INTEGER NOT NULL DEFAULT 7,
  "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archived_at" TIMESTAMPTZ(6),
  CONSTRAINT "client_routine_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "client_routine_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "client_routine_source_template_id_fkey" FOREIGN KEY ("source_template_id") REFERENCES "plan_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "client_routine_base_template_id_fkey" FOREIGN KEY ("base_template_id") REFERENCES "plan_template"("id") ON DELETE NO ACTION ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "client_routine_base_template_id_key" ON "client_routine"("base_template_id");
CREATE INDEX "idx_client_routine_client" ON "client_routine"("client_id", "archived_at");

CREATE TABLE "client_routine_week" (
  "id" UUID NOT NULL,
  "client_routine_id" UUID NOT NULL,
  "week_index" INTEGER NOT NULL,
  "starts_on" DATE NOT NULL,
  "template_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_routine_week_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "client_routine_week_client_routine_id_fkey" FOREIGN KEY ("client_routine_id") REFERENCES "client_routine"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "client_routine_week_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "plan_template"("id") ON DELETE NO ACTION ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "client_routine_week_template_id_key" ON "client_routine_week"("template_id");
CREATE UNIQUE INDEX "uq_client_routine_week_index" ON "client_routine_week"("client_routine_id", "week_index");
