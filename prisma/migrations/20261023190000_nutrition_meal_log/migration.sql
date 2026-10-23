CREATE TYPE "NutritionMealStatus" AS ENUM ('DONE', 'CHANGED', 'SKIPPED');

CREATE TABLE "nutrition_meal_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "meal_key" VARCHAR(80) NOT NULL,
  "meal_name" VARCHAR(120) NOT NULL,
  "status" "NutritionMealStatus" NOT NULL,
  "comment" VARCHAR(500),
  "photo_path" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nutrition_meal_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_nutrition_meal_log" ON "nutrition_meal_log"("client_id", "plan_id", "date", "meal_key");
CREATE INDEX "idx_nutrition_meal_log_client_date" ON "nutrition_meal_log"("client_id", "date");

ALTER TABLE "nutrition_meal_log"
  ADD CONSTRAINT "nutrition_meal_log_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nutrition_meal_log"
  ADD CONSTRAINT "nutrition_meal_log_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "nutrition_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
