-- T11 base schema: users, roles, organization bindings
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Role" AS ENUM ('ADMIN', 'COACH', 'CLIENT');

CREATE TABLE "organization" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(120) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE TABLE "user_account" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(320) NOT NULL,
  "supabase_uid" UUID NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "uq_user_account_email" UNIQUE ("email"),
  CONSTRAINT "uq_user_account_supabase_uid" UNIQUE ("supabase_uid")
);

CREATE TABLE "organization_member" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" "Role" NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_org_member_organization" FOREIGN KEY ("organization_id")
    REFERENCES "organization"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_org_member_user" FOREIGN KEY ("user_id")
    REFERENCES "user_account"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_org_user_role" UNIQUE ("organization_id", "user_id", "role")
);

CREATE INDEX "idx_org_member_org_role" ON "organization_member" ("organization_id", "role");
CREATE INDEX "idx_org_member_user" ON "organization_member" ("user_id");
