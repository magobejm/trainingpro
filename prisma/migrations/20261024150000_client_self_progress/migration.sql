ALTER TABLE "client_progress_photo" ADD COLUMN "pose" VARCHAR(10);
ALTER TABLE "client_progress_photo" ADD COLUMN "uploaded_by" VARCHAR(10) NOT NULL DEFAULT 'coach';

CREATE TABLE "client_measurement" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "weight_kg" DECIMAL(6,2),
    "waist_cm" DECIMAL(6,2),
    "hip_cm" DECIMAL(6,2),
    "height_cm" DECIMAL(6,2),
    "recorded_by" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_measurement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_client_measurement_client_created" ON "client_measurement"("client_id", "created_at");

ALTER TABLE "client_measurement" ADD CONSTRAINT "client_measurement_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
