-- Add equipment metadata for cardio and plyometric libraries
ALTER TABLE "cardio_method"
ADD COLUMN "equipment" VARCHAR(120);

ALTER TABLE "plio_exercise"
ADD COLUMN "equipment" VARCHAR(120);

-- Replace warmup notes with mobility type selector
ALTER TABLE "warmup_exercise"
ADD COLUMN "mobility_type" VARCHAR(30);

UPDATE "warmup_exercise"
SET "mobility_type" = 'minimo'
WHERE "mobility_type" IS NULL;

ALTER TABLE "warmup_exercise"
DROP COLUMN "notes";
