CREATE TABLE IF NOT EXISTS "client_management_section" (
  "id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "code" VARCHAR(40) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "client_management_section_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_client_management_section_client" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_client_management_section_client_code"
  ON "client_management_section"("client_id", "code");

CREATE INDEX IF NOT EXISTS "idx_client_management_section_lookup"
  ON "client_management_section"("client_id", "archived", "sort_order");
