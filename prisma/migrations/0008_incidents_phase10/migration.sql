-- Fase 10: incidents + guided actions
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'REVIEWED', 'CLOSED');
CREATE TYPE "IncidentActionType" AS ENUM (
  'ALERTED',
  'REVIEWED',
  'RESPONDED',
  'TAGGED',
  'ADJUSTMENT_DRAFTED'
);

CREATE TABLE "incident" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "coach_membership_id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "session_id" UUID,
  "session_item_id" UUID,
  "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
  "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
  "description" TEXT NOT NULL,
  "tag" VARCHAR(60),
  "coach_response" TEXT,
  "adjustment_draft" TEXT,
  "coach_alerted_at" TIMESTAMPTZ(6),
  "reviewed_at" TIMESTAMPTZ(6),
  "archived_at" TIMESTAMPTZ(6),
  "created_by" UUID NOT NULL,
  "updated_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "incident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "incident_action" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "incident_id" UUID NOT NULL,
  "action_type" "IncidentActionType" NOT NULL,
  "payload_json" JSONB,
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "incident_action_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_incident_coach_status_created"
ON "incident"("coach_membership_id", "status", "created_at");

CREATE INDEX "idx_incident_client_created"
ON "incident"("client_id", "created_at");

CREATE INDEX "idx_incident_session"
ON "incident"("session_id");

CREATE INDEX "idx_incident_action_incident_created"
ON "incident_action"("incident_id", "created_at");

ALTER TABLE "incident"
ADD CONSTRAINT "incident_organization_id_fkey"
FOREIGN KEY ("organization_id")
REFERENCES "organization"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "incident"
ADD CONSTRAINT "incident_coach_membership_id_fkey"
FOREIGN KEY ("coach_membership_id")
REFERENCES "organization_member"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "incident"
ADD CONSTRAINT "incident_client_id_fkey"
FOREIGN KEY ("client_id")
REFERENCES "client"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "incident"
ADD CONSTRAINT "incident_session_id_fkey"
FOREIGN KEY ("session_id")
REFERENCES "session_instance"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "incident"
ADD CONSTRAINT "incident_session_item_id_fkey"
FOREIGN KEY ("session_item_id")
REFERENCES "session_strength_item"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "incident_action"
ADD CONSTRAINT "incident_action_incident_id_fkey"
FOREIGN KEY ("incident_id")
REFERENCES "incident"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
