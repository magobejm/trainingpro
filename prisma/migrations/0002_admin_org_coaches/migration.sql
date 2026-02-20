-- T22/T24 admin org subscription + coach management
CREATE TABLE "organization_subscription" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "client_limit" INTEGER NOT NULL DEFAULT 0,
  "active_client_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_org_subscription_organization" FOREIGN KEY ("organization_id")
    REFERENCES "organization"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_org_subscription_organization" UNIQUE ("organization_id")
);

ALTER TABLE "organization_member"
ADD COLUMN "archived_at" TIMESTAMPTZ(6);
