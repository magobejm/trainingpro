-- Per-set advanced technique (Top set, etc.) for non-strength block types in routine planner
ALTER TABLE "plan_cardio_set" ADD COLUMN "advanced_technique" VARCHAR(40);
ALTER TABLE "plan_plio_set" ADD COLUMN "advanced_technique" VARCHAR(40);
ALTER TABLE "plan_sport_set" ADD COLUMN "advanced_technique" VARCHAR(40);
ALTER TABLE "plan_isometric_set" ADD COLUMN "advanced_technique" VARCHAR(40);

-- Block-level target RPE for isometric (API already sends it; aligns with plio/cardio/sport blocks)
ALTER TABLE "plan_isometric_block" ADD COLUMN "target_rpe" INTEGER;
