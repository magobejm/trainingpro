-- Se retiran el copilot de IA y las reglas de progresión automática.
DROP TABLE IF EXISTS "copilot_usage";
ALTER TABLE "plan_strength_exercise" DROP COLUMN IF EXISTS "progression_rule";
ALTER TABLE "plan_template" DROP COLUMN IF EXISTS "block_weeks";
