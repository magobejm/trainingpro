-- Perceived session RPE (1-10, half points) collected at the end of a workout.
ALTER TABLE "session_instance" ADD COLUMN "session_rpe" DECIMAL(3, 1);
