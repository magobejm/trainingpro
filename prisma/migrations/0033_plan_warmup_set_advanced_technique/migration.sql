-- Per-set advanced technique for mobility blocks (API: plan_warmup_* / warmupBlocks; UI: blockType "mobility")
ALTER TABLE "plan_warmup_set" ADD COLUMN "advanced_technique" VARCHAR(40);
