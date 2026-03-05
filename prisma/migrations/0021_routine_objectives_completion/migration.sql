ALTER TABLE "plan_template"
ADD COLUMN "expected_completion_days" INTEGER;

CREATE TABLE "plan_template_objective" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "template_id" UUID NOT NULL,
  "objective_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "plan_template_objective_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "plan_template_objective_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "plan_template"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "plan_template_objective_objective_id_fkey"
    FOREIGN KEY ("objective_id") REFERENCES "client_objective"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_plan_template_objective"
ON "plan_template_objective"("template_id", "objective_id");

CREATE INDEX "idx_plan_template_objective_template"
ON "plan_template_objective"("template_id");

CREATE INDEX "idx_plan_template_objective_objective"
ON "plan_template_objective"("objective_id");
