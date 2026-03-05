ALTER TABLE "client"
ADD COLUMN "waist_cm" INTEGER,
ADD COLUMN "hip_cm" INTEGER,
ADD COLUMN "fc_max" INTEGER,
ADD COLUMN "fc_rest" INTEGER,
ADD COLUMN "fitness_level" VARCHAR(30),
ADD COLUMN "secondary_objectives" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "injuries" TEXT,
ADD COLUMN "allergies" TEXT;
