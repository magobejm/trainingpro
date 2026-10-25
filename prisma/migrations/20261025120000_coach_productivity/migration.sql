-- Coach productivity: check-ins, measurements, progression, intake and internal pricing.

CREATE TYPE "ClientIntakeStatus" AS ENUM ('PENDING', 'COMPLETED');

ALTER TABLE "client" ADD COLUMN "available_days" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "client" ADD COLUMN "equipment" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "client" ADD COLUMN "parq_flags" JSONB;

ALTER TABLE "client_measurement" ADD COLUMN "body_fat_pct" DECIMAL(5,2);
ALTER TABLE "client_measurement" ADD COLUMN "skinfolds_json" JSONB;
ALTER TABLE "client_measurement" ADD COLUMN "fc_rest" INTEGER;
ALTER TABLE "client_measurement" ADD COLUMN "fc_max" INTEGER;
ALTER TABLE "client_measurement" ADD COLUMN "measured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "client_measurement" ADD COLUMN "notes" TEXT;
UPDATE "client_measurement" SET "measured_at" = "created_at";
CREATE INDEX "idx_client_measurement_client_measured" ON "client_measurement"("client_id", "measured_at");

CREATE TABLE "daily_checkin" (
  "id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "coach_membership_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "sleep" INTEGER NOT NULL,
  "fatigue" INTEGER NOT NULL,
  "motivation" INTEGER NOT NULL,
  "recovery" INTEGER NOT NULL,
  "pain" INTEGER,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_checkin_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_daily_checkin_client_date" ON "daily_checkin"("client_id", "date");
CREATE INDEX "idx_daily_checkin_coach_date" ON "daily_checkin"("coach_membership_id", "date");
ALTER TABLE "daily_checkin" ADD CONSTRAINT "daily_checkin_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "daily_checkin" ADD CONSTRAINT "daily_checkin_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "client_intake" (
  "id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "status" "ClientIntakeStatus" NOT NULL DEFAULT 'PENDING',
  "answers" JSONB NOT NULL DEFAULT '{}',
  "completed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "client_intake_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "client_intake_client_id_key" ON "client_intake"("client_id");
ALTER TABLE "client_intake" ADD CONSTRAINT "client_intake_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plan_template" ADD COLUMN "block_weeks" INTEGER;
ALTER TABLE "plan_strength_exercise" ADD COLUMN "progression_rule" JSONB;
ALTER TABLE "weekly_report" ADD COLUMN "reviewed_at" TIMESTAMPTZ(6);

CREATE TABLE "pricing_tier" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "from_clients" INTEGER NOT NULL,
  "to_clients" INTEGER,
  "monthly_price" DECIMAL(10,2) NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "pricing_tier_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_pricing_tier_org_from" ON "pricing_tier"("organization_id", "from_clients");
ALTER TABLE "pricing_tier" ADD CONSTRAINT "pricing_tier_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "billing_snapshot" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "day" DATE NOT NULL,
  "active_client_count" INTEGER NOT NULL,
  CONSTRAINT "billing_snapshot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_billing_snapshot_org_day" ON "billing_snapshot"("organization_id", "day");
ALTER TABLE "billing_snapshot" ADD CONSTRAINT "billing_snapshot_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "copilot_usage" (
  "id" UUID NOT NULL,
  "coach_membership_id" UUID NOT NULL,
  "day" DATE NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "copilot_usage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_copilot_usage_coach_day" ON "copilot_usage"("coach_membership_id", "day");
ALTER TABLE "copilot_usage" ADD CONSTRAINT "copilot_usage_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
