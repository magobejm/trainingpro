-- Routine mobility blocks (coach planner) vs warmup templates (plan_day_warmup / warmup_template).

ALTER TABLE "plan_warmup_block" RENAME TO "plan_mobility_block";
ALTER TABLE "plan_warmup_set" RENAME TO "plan_mobility_set";
ALTER TABLE "warmup_field_mode" RENAME TO "mobility_field_mode";

ALTER TABLE "plan_mobility_block" RENAME COLUMN "warmup_exercise_library_id" TO "mobility_exercise_library_id";
ALTER TABLE "mobility_field_mode" RENAME COLUMN "plan_warmup_block_id" TO "plan_mobility_block_id";
ALTER TABLE "warmup_template_item" RENAME COLUMN "warmup_exercise_library_id" TO "mobility_exercise_library_id";

ALTER TABLE "plan_mobility_block" RENAME CONSTRAINT "plan_warmup_block_pkey" TO "plan_mobility_block_pkey";
ALTER TABLE "plan_mobility_set" RENAME CONSTRAINT "plan_warmup_set_pkey" TO "plan_mobility_set_pkey";
ALTER TABLE "plan_mobility_set" RENAME CONSTRAINT "uq_plan_warmup_set" TO "uq_plan_mobility_set";
ALTER TABLE "mobility_field_mode" RENAME CONSTRAINT "warmup_field_mode_pkey" TO "mobility_field_mode_pkey";
ALTER TABLE "mobility_field_mode" RENAME CONSTRAINT "uq_warmup_field_mode_item_field" TO "uq_mobility_field_mode_item_field";

ALTER TABLE "plan_mobility_block" RENAME CONSTRAINT "plan_warmup_block_day_id_fkey" TO "plan_mobility_block_day_id_fkey";
ALTER TABLE "plan_mobility_block" RENAME CONSTRAINT "plan_warmup_block_group_id_fkey" TO "plan_mobility_block_group_id_fkey";
ALTER TABLE "plan_mobility_block" RENAME CONSTRAINT "plan_warmup_block_warmup_exercise_library_id_fkey" TO "plan_mobility_block_mobility_exercise_library_id_fkey";

ALTER TABLE "plan_mobility_set" RENAME CONSTRAINT "plan_warmup_set_block_id_fkey" TO "plan_mobility_set_block_id_fkey";

ALTER TABLE "mobility_field_mode" RENAME CONSTRAINT "warmup_field_mode_plan_warmup_block_id_fkey" TO "mobility_field_mode_plan_mobility_block_id_fkey";

ALTER TABLE "warmup_template_item" RENAME CONSTRAINT "warmup_template_item_warmup_exercise_library_id_fkey" TO "warmup_template_item_mobility_exercise_library_id_fkey";

ALTER INDEX "idx_plan_warmup_day_archived" RENAME TO "idx_plan_mobility_day_archived";
ALTER INDEX "idx_plan_warmup_group" RENAME TO "idx_plan_mobility_group";
ALTER INDEX "idx_plan_warmup_set_block" RENAME TO "idx_plan_mobility_set_block";
ALTER INDEX "idx_warmup_field_mode_item" RENAME TO "idx_mobility_field_mode_item";
