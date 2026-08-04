-- Migration 0004: allow half-step RPE on plan set tables

ALTER TABLE "plan_strength_set"
  ALTER COLUMN "rpe" TYPE DECIMAL(3, 1) USING "rpe"::decimal;

ALTER TABLE "plan_cardio_set"
  ALTER COLUMN "rpe" TYPE DECIMAL(3, 1) USING "rpe"::decimal;

ALTER TABLE "plan_plio_set"
  ALTER COLUMN "rpe" TYPE DECIMAL(3, 1) USING "rpe"::decimal;

ALTER TABLE "plan_isometric_set"
  ALTER COLUMN "rpe" TYPE DECIMAL(3, 1) USING "rpe"::decimal;

ALTER TABLE "plan_mobility_set"
  ALTER COLUMN "rpe" TYPE DECIMAL(3, 1) USING "rpe"::decimal;

ALTER TABLE "plan_sport_set"
  ALTER COLUMN "rpe" TYPE DECIMAL(3, 1) USING "rpe"::decimal;
