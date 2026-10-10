CREATE UNIQUE INDEX "uq_client_org_active_email"
  ON "client" ("organization_id", "email")
  WHERE "archived_at" IS NULL;
