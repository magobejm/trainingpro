ALTER TABLE "plan_cardio_set"
  ADD COLUMN "heart_rate_max" INTEGER,
  ADD COLUMN "fc_max_pct_max" INTEGER,
  ADD COLUMN "fc_reserve_pct_max" INTEGER;

ALTER TABLE "plan_sport_set"
  ADD COLUMN "heart_rate_max" INTEGER,
  ADD COLUMN "fc_max_pct_max" INTEGER,
  ADD COLUMN "fc_reserve_pct_max" INTEGER;

ALTER TABLE "interval_log"
  ADD COLUMN "avg_heart_rate_max" INTEGER,
  ADD COLUMN "hr_max_pct_done_max" DOUBLE PRECISION,
  ADD COLUMN "hr_reserve_pct_done_max" DOUBLE PRECISION;

ALTER TABLE "sport_set_log"
  ADD COLUMN "heart_rate_done_max" INTEGER,
  ADD COLUMN "hr_max_pct_done_max" INTEGER,
  ADD COLUMN "hr_reserve_pct_done_max" INTEGER;
