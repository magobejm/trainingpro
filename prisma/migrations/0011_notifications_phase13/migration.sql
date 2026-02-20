-- Fase 13: notifications and preferences
CREATE TYPE "NotificationTopic" AS ENUM (
  'SESSION_COMPLETED',
  'INCIDENT_CRITICAL',
  'CLIENT_INACTIVE_3D',
  'ADHERENCE_LOW_WEEKLY',
  'CLIENT_REMINDER'
);

CREATE TABLE "notification_device_token" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "membership_id" UUID,
  "role" "Role" NOT NULL,
  "token" VARCHAR(255) NOT NULL,
  "platform" VARCHAR(30) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_seen_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_device_token_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_device_token_token_key"
ON "notification_device_token"("token");

CREATE INDEX "idx_notification_device_org_role_active"
ON "notification_device_token"("organization_id", "role", "is_active");

CREATE INDEX "idx_notification_device_membership_active"
ON "notification_device_token"("membership_id", "is_active");

CREATE TABLE "notification_preference" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "coach_membership_id" UUID NOT NULL,
  "topic" "NotificationTopic" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_notification_pref_coach_topic"
ON "notification_preference"("coach_membership_id", "topic");

CREATE INDEX "idx_notification_pref_coach"
ON "notification_preference"("coach_membership_id");

CREATE TABLE "notification_event_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "coach_membership_id" UUID,
  "client_id" UUID,
  "topic" "NotificationTopic" NOT NULL,
  "dedupe_key" VARCHAR(180),
  "payload_json" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_event_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_event_log_dedupe_key_key"
ON "notification_event_log"("dedupe_key");

CREATE INDEX "idx_notification_event_org_topic_created"
ON "notification_event_log"("organization_id", "topic", "created_at");

CREATE INDEX "idx_notification_event_coach_topic_created"
ON "notification_event_log"("coach_membership_id", "topic", "created_at");

CREATE INDEX "idx_notification_event_client_topic_created"
ON "notification_event_log"("client_id", "topic", "created_at");

ALTER TABLE "notification_device_token"
ADD CONSTRAINT "notification_device_token_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_device_token"
ADD CONSTRAINT "notification_device_token_membership_id_fkey"
FOREIGN KEY ("membership_id") REFERENCES "organization_member"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notification_preference"
ADD CONSTRAINT "notification_preference_coach_membership_id_fkey"
FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_event_log"
ADD CONSTRAINT "notification_event_log_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_event_log"
ADD CONSTRAINT "notification_event_log_coach_membership_id_fkey"
FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notification_event_log"
ADD CONSTRAINT "notification_event_log_client_id_fkey"
FOREIGN KEY ("client_id") REFERENCES "client"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
