-- CreateEnum
CREATE TYPE "CallProposalStatus" AS ENUM ('pending', 'accepted', 'cancelled');

-- AlterTable
ALTER TABLE "chat_message" ADD COLUMN "call_proposal_id" UUID;

-- CreateTable
CREATE TABLE "client_day_note" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "client_day_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_proposal" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "coach_membership_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "proposed_time" VARCHAR(5) NOT NULL,
    "status" "CallProposalStatus" NOT NULL DEFAULT 'pending',
    "initiated_by" "ChatMessageSender" NOT NULL,
    "last_proposed_by" "ChatMessageSender" NOT NULL,
    "calendar_event_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "call_proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_client_day_note_client_date" ON "client_day_note"("client_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "call_proposal_calendar_event_id_key" ON "call_proposal"("calendar_event_id");

-- CreateIndex
CREATE INDEX "idx_call_proposal_coach_date" ON "call_proposal"("coach_membership_id", "date");

-- CreateIndex
CREATE INDEX "idx_call_proposal_client_date" ON "call_proposal"("client_id", "date");

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_call_proposal_id_fkey" FOREIGN KEY ("call_proposal_id") REFERENCES "call_proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_day_note" ADD CONSTRAINT "client_day_note_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_proposal" ADD CONSTRAINT "call_proposal_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_proposal" ADD CONSTRAINT "call_proposal_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_proposal" ADD CONSTRAINT "call_proposal_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_proposal" ADD CONSTRAINT "call_proposal_calendar_event_id_fkey" FOREIGN KEY ("calendar_event_id") REFERENCES "calendar_event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
