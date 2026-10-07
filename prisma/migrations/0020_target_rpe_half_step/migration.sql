-- Allow half-step RPE on the exercise and cardio targets the coach edits on the web.

ALTER TABLE "plan_strength_exercise"
  ALTER COLUMN "target_rpe" TYPE DECIMAL(3, 1) USING "target_rpe"::decimal;

ALTER TABLE "plan_cardio_block"
  ALTER COLUMN "target_rpe" TYPE DECIMAL(3, 1) USING "target_rpe"::decimal;

ALTER TABLE "session_strength_item"
  ALTER COLUMN "target_rpe" TYPE DECIMAL(3, 1) USING "target_rpe"::decimal;

ALTER TABLE "session_cardio_block"
  ALTER COLUMN "target_rpe" TYPE DECIMAL(3, 1) USING "target_rpe"::decimal;
