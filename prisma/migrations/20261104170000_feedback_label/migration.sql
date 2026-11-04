-- Existing notes and incidents stay in the client card. REVIEW is the extra mark for the later section.
CREATE TYPE "FeedbackLabel" AS ENUM ('REVIEW', 'OTHER');
ALTER TABLE "incident" ADD COLUMN "label" "FeedbackLabel" NOT NULL DEFAULT 'OTHER';
ALTER TABLE "client_note" ADD COLUMN "label" "FeedbackLabel" NOT NULL DEFAULT 'OTHER';
