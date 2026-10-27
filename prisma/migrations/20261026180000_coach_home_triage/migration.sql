-- AlterTable
ALTER TABLE "chat_thread" ADD COLUMN "coach_last_read_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "organization_member" ADD COLUMN "coach_home_collapsed" TEXT[] DEFAULT ARRAY[]::TEXT[];
