-- Wearable connections, inbound events and normalized health data.

CREATE TYPE "WearableProviderKind" AS ENUM ('GARMIN', 'POLAR', 'STRAVA', 'HEALTH_CONNECT', 'HEALTHKIT');
CREATE TYPE "WearableConnectionStatus" AS ENUM ('PENDING', 'CONNECTED', 'REVOKED');
CREATE TYPE "IntegrationEventStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

CREATE TABLE "wearable_connection" (
  "id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "provider" "WearableProviderKind" NOT NULL,
  "external_user_id" VARCHAR(120),
  "access_token_enc" TEXT,
  "refresh_token_enc" TEXT,
  "expires_at" TIMESTAMPTZ(6),
  "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "WearableConnectionStatus" NOT NULL DEFAULT 'PENDING',
  "auto_export" BOOLEAN NOT NULL DEFAULT false,
  "connected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_sync_at" TIMESTAMPTZ(6),
  CONSTRAINT "wearable_connection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_wearable_connection_client_provider" ON "wearable_connection"("client_id", "provider");
ALTER TABLE "wearable_connection" ADD CONSTRAINT "wearable_connection_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "integration_event" (
  "id" UUID NOT NULL,
  "provider" "WearableProviderKind" NOT NULL,
  "type" VARCHAR(80) NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "IntegrationEventStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMPTZ(6),
  CONSTRAINT "integration_event_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_integration_event_status_created" ON "integration_event"("status", "created_at");

CREATE TABLE "wearable_activity" (
  "id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "source" "WearableProviderKind" NOT NULL,
  "external_id" VARCHAR(160) NOT NULL,
  "sport_type" VARCHAR(40) NOT NULL,
  "start_at" TIMESTAMPTZ(6) NOT NULL,
  "duration_s" INTEGER NOT NULL,
  "distance_m" INTEGER,
  "avg_hr" INTEGER,
  "max_hr" INTEGER,
  "calories" INTEGER,
  "training_load" INTEGER,
  "laps_json" JSONB,
  "fit_path" TEXT,
  "matched_session_id" UUID,
  CONSTRAINT "wearable_activity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_wearable_activity_source_external" ON "wearable_activity"("source", "external_id");
CREATE INDEX "idx_wearable_activity_client_start" ON "wearable_activity"("client_id", "start_at");
ALTER TABLE "wearable_activity" ADD CONSTRAINT "wearable_activity_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "daily_health_metric" (
  "id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "source" "WearableProviderKind" NOT NULL,
  "steps" INTEGER,
  "active_kcal" INTEGER,
  "sleep_minutes" INTEGER,
  "sleep_score" INTEGER,
  "resting_hr" INTEGER,
  "hrv_ms" INTEGER,
  "body_battery" INTEGER,
  "weight_kg" DECIMAL(6,2),
  CONSTRAINT "daily_health_metric_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_daily_health_client_date_source" ON "daily_health_metric"("client_id", "date", "source");
CREATE INDEX "idx_daily_health_client_date" ON "daily_health_metric"("client_id", "date");
ALTER TABLE "daily_health_metric" ADD CONSTRAINT "daily_health_metric_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "garmin_workout_sync" (
  "id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "routine_key" VARCHAR(120) NOT NULL,
  "garmin_workout_id" VARCHAR(80),
  "status" VARCHAR(20) NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "garmin_workout_sync_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_garmin_workout_client_created" ON "garmin_workout_sync"("client_id", "created_at");
ALTER TABLE "garmin_workout_sync" ADD CONSTRAINT "garmin_workout_sync_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
