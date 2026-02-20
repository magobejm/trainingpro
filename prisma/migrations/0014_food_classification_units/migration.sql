ALTER TABLE "food"
ADD COLUMN IF NOT EXISTS "food_type" VARCHAR(40),
ADD COLUMN IF NOT EXISTS "food_category" VARCHAR(80);

UPDATE "food"
SET "serving_unit" = CASE
  WHEN "serving_unit" IS NULL THEN NULL
  WHEN LOWER(TRIM("serving_unit")) IN ('100g', 'g', 'gramos') THEN '100g'
  WHEN LOWER(TRIM("serving_unit")) IN ('100ml', 'ml', 'mililitros') THEN '100ml'
  WHEN LOWER(TRIM("serving_unit")) IN ('porcion', 'unidad') THEN 'porcion'
  ELSE NULL
END;

ALTER TABLE "food"
ADD CONSTRAINT "chk_food_serving_unit"
CHECK (
  "serving_unit" IS NULL
  OR "serving_unit" IN ('100g', '100ml', 'porcion')
);
