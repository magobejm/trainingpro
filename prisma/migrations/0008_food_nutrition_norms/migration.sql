-- Extra nutrient fields for nutrition-norm considerations (per serving unit).
ALTER TABLE "food" ADD COLUMN "fiber_g" DECIMAL(6, 2);
ALTER TABLE "food" ADD COLUMN "sugar_g" DECIMAL(6, 2);
ALTER TABLE "food" ADD COLUMN "saturated_fat_g" DECIMAL(6, 2);
ALTER TABLE "food" ADD COLUMN "salt_g" DECIMAL(6, 2);
ALTER TABLE "food" ADD COLUMN "unsaturated_fat_g" DECIMAL(6, 2);
ALTER TABLE "food" ADD COLUMN "micronutrients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
