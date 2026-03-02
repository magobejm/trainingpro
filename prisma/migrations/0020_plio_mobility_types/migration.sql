ALTER TABLE "plio_exercise"
ADD COLUMN "plio_type" VARCHAR(30);

UPDATE "plio_exercise"
SET "plio_type" = 'undefined'
WHERE "plio_type" IS NULL;

UPDATE "warmup_exercise"
SET "mobility_type" = 'undefined'
WHERE "mobility_type" IS NULL;
