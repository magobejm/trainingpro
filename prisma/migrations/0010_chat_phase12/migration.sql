-- Fase 12: chat, adjuntos y TTL
CREATE TYPE "ChatMessageSender" AS ENUM ('COACH', 'CLIENT');

CREATE TYPE "ChatAttachmentKind" AS ENUM ('IMAGE', 'AUDIO', 'PDF');

CREATE TABLE "chat_thread" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "coach_membership_id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "archived_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_thread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_message" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "thread_id" UUID NOT NULL,
  "sender_role" "ChatMessageSender" NOT NULL,
  "sender_subject" VARCHAR(120) NOT NULL,
  "text" VARCHAR(2000),
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_attachment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "message_id" UUID NOT NULL,
  "kind" "ChatAttachmentKind" NOT NULL,
  "file_name" VARCHAR(160) NOT NULL,
  "mime_type" VARCHAR(120) NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "storage_path" VARCHAR(500) NOT NULL,
  "public_url" VARCHAR(500),
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_attachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_chat_thread_coach_client"
ON "chat_thread"("coach_membership_id", "client_id");

CREATE INDEX "idx_chat_thread_client_updated"
ON "chat_thread"("client_id", "updated_at");

CREATE INDEX "idx_chat_thread_coach_updated"
ON "chat_thread"("coach_membership_id", "updated_at");

CREATE INDEX "idx_chat_message_thread_created"
ON "chat_message"("thread_id", "created_at");

CREATE INDEX "idx_chat_message_expires"
ON "chat_message"("expires_at");

CREATE UNIQUE INDEX "uq_chat_attachment_message_path"
ON "chat_attachment"("message_id", "storage_path");

CREATE INDEX "idx_chat_attachment_message"
ON "chat_attachment"("message_id");

CREATE INDEX "idx_chat_attachment_expires"
ON "chat_attachment"("expires_at");

ALTER TABLE "chat_thread"
ADD CONSTRAINT "chat_thread_organization_id_fkey"
FOREIGN KEY ("organization_id")
REFERENCES "organization"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "chat_thread"
ADD CONSTRAINT "chat_thread_coach_membership_id_fkey"
FOREIGN KEY ("coach_membership_id")
REFERENCES "organization_member"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "chat_thread"
ADD CONSTRAINT "chat_thread_client_id_fkey"
FOREIGN KEY ("client_id")
REFERENCES "client"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "chat_message"
ADD CONSTRAINT "chat_message_thread_id_fkey"
FOREIGN KEY ("thread_id")
REFERENCES "chat_thread"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "chat_attachment"
ADD CONSTRAINT "chat_attachment_message_id_fkey"
FOREIGN KEY ("message_id")
REFERENCES "chat_message"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

