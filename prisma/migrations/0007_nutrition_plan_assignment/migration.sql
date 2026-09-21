-- AlterTable: clone-on-assign support and cascade client delete
ALTER TABLE "nutrition_plan" ADD COLUMN "source_plan_id" UUID;

ALTER TABLE "nutrition_plan" DROP CONSTRAINT "nutrition_plan_client_id_fkey";

ALTER TABLE "nutrition_plan" ADD CONSTRAINT "nutrition_plan_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nutrition_plan" ADD CONSTRAINT "nutrition_plan_source_plan_id_fkey" FOREIGN KEY ("source_plan_id") REFERENCES "nutrition_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "idx_nutrition_plan_source" ON "nutrition_plan"("source_plan_id");

-- One active plan per type per client (templates keep client_id NULL)
CREATE UNIQUE INDEX "uq_nutrition_plan_client_type_active" ON "nutrition_plan"("client_id", "type") WHERE "client_id" IS NOT NULL AND "archived_at" IS NULL;
