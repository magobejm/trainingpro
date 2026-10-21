ALTER TABLE "session_instance" ADD COLUMN "performed_duration_seconds" INTEGER;
ALTER TABLE "session_cardio_block" ADD COLUMN "distance_done_meters" DOUBLE PRECISION;
ALTER TABLE "interval_log" ADD COLUMN "hr_max_pct_done" DOUBLE PRECISION, ADD COLUMN "hr_reserve_pct_done" DOUBLE PRECISION;
