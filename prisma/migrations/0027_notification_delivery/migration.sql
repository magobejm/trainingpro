-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED', 'INVALID_TOKEN');

-- AlterTable
ALTER TABLE "notification_device_token" ADD COLUMN "client_id" UUID;

-- AlterTable
ALTER TABLE "notification_event_log" ADD COLUMN "processed_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "notification_delivery" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "device_token_id" UUID NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_error" VARCHAR(300),
    "expo_ticket_id" VARCHAR(180),
    "sent_at" TIMESTAMPTZ(6),
    "receipt_checked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_notification_delivery_event_token" ON "notification_delivery"("event_id", "device_token_id");

-- CreateIndex
CREATE INDEX "idx_notification_delivery_status_next" ON "notification_delivery"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "idx_notification_delivery_status_sent" ON "notification_delivery"("status", "sent_at");

-- CreateIndex
CREATE INDEX "idx_notification_device_client_active" ON "notification_device_token"("client_id", "is_active");

-- Events still waiting to be fanned out to devices.
CREATE INDEX "idx_notification_event_unprocessed" ON "notification_event_log"("created_at") WHERE "processed_at" IS NULL;

-- AddForeignKey
ALTER TABLE "notification_device_token" ADD CONSTRAINT "notification_device_token_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "notification_event_log"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_device_token_id_fkey" FOREIGN KEY ("device_token_id") REFERENCES "notification_device_token"("id") ON DELETE CASCADE ON UPDATE CASCADE;
