-- Account preference only. Existing session records and snapshots are unchanged.
ALTER TABLE "public"."client" ADD COLUMN "first_workout_guide" JSONB;
