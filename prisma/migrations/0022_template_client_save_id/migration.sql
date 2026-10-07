ALTER TABLE "plan_template" ADD COLUMN "client_save_id" UUID;

CREATE UNIQUE INDEX "uq_plan_template_coach_client_save"
  ON "plan_template" ("coach_membership_id", "client_save_id");

ALTER TABLE "warmup_template" ADD COLUMN "client_save_id" UUID;

CREATE UNIQUE INDEX "uq_warmup_template_coach_client_save"
  ON "warmup_template" ("coach_membership_id", "client_save_id");
