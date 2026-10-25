ALTER TYPE "ChatAttachmentKind" ADD VALUE IF NOT EXISTS 'VIDEO';

ALTER TABLE "food" ADD COLUMN "barcode" VARCHAR(32);
CREATE INDEX "idx_food_barcode" ON "food"("barcode");

ALTER TABLE "nutrition_meal_log" ADD COLUMN "ai_estimate" JSONB;
