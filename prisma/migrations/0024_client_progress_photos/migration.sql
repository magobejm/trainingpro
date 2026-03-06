ALTER TABLE "client"
ADD COLUMN "considerations" TEXT;

CREATE TABLE IF NOT EXISTS "client_progress_photo" (
  "id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "image_url" VARCHAR(500) NOT NULL,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "client_progress_photo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_client_progress_photo_client" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_client_progress_photo_client_archived_created"
  ON "client_progress_photo"("client_id", "archived", "created_at");
