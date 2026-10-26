ALTER TABLE "plan_template" ADD COLUMN IF NOT EXISTS "mesocycle_microcycles" INTEGER;
ALTER TABLE "plan_strength_exercise" ADD COLUMN IF NOT EXISTS "progression_rule" JSONB;
