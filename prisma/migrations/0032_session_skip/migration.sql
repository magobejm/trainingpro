ALTER TABLE "session_instance" ADD COLUMN "skipped_at" TIMESTAMPTZ(6);
ALTER TABLE "session_instance" ADD COLUMN "skip_reason" VARCHAR(280);
