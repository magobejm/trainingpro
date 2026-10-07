-- Store every remaining RPE column as a half step. Existing whole numbers are preserved.

ALTER TABLE "warmup_template_item"
  ALTER COLUMN "target_rpe" TYPE DECIMAL(3, 1) USING "target_rpe"::decimal;

ALTER TABLE "plan_plio_block"
  ALTER COLUMN "target_rpe" TYPE DECIMAL(3, 1) USING "target_rpe"::decimal;

ALTER TABLE "plan_mobility_block"
  ALTER COLUMN "target_rpe" TYPE DECIMAL(3, 1) USING "target_rpe"::decimal;

ALTER TABLE "plan_sport_block"
  ALTER COLUMN "target_rpe" TYPE DECIMAL(3, 1) USING "target_rpe"::decimal;

ALTER TABLE "plan_isometric_block"
  ALTER COLUMN "target_rpe" TYPE DECIMAL(3, 1) USING "target_rpe"::decimal;

ALTER TABLE "session_plio_block"
  ALTER COLUMN "target_rpe" TYPE DECIMAL(3, 1) USING "target_rpe"::decimal;

ALTER TABLE "session_mobility_block"
  ALTER COLUMN "target_rpe" TYPE DECIMAL(3, 1) USING "target_rpe"::decimal;

ALTER TABLE "session_isometric_block"
  ALTER COLUMN "target_rpe" TYPE DECIMAL(3, 1) USING "target_rpe"::decimal;

ALTER TABLE "session_sport_block"
  ALTER COLUMN "target_rpe" TYPE DECIMAL(3, 1) USING "target_rpe"::decimal;

ALTER TABLE "set_log"
  ALTER COLUMN "effort_rpe" TYPE DECIMAL(3, 1) USING "effort_rpe"::decimal;

ALTER TABLE "interval_log"
  ALTER COLUMN "effort_rpe" TYPE DECIMAL(3, 1) USING "effort_rpe"::decimal;

ALTER TABLE "plio_set_log"
  ALTER COLUMN "effort_rpe" TYPE DECIMAL(3, 1) USING "effort_rpe"::decimal;

ALTER TABLE "mobility_set_log"
  ALTER COLUMN "effort_rpe" TYPE DECIMAL(3, 1) USING "effort_rpe"::decimal;

ALTER TABLE "isometric_set_log"
  ALTER COLUMN "effort_rpe" TYPE DECIMAL(3, 1) USING "effort_rpe"::decimal;

ALTER TABLE "sport_session_log"
  ALTER COLUMN "effort_rpe" TYPE DECIMAL(3, 1) USING "effort_rpe"::decimal;

ALTER TABLE "sport_set_log"
  ALTER COLUMN "effort_rpe" TYPE DECIMAL(3, 1) USING "effort_rpe"::decimal;
