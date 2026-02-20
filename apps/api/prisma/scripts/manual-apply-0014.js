const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "food"
      ADD COLUMN IF NOT EXISTS "food_type" VARCHAR(40),
      ADD COLUMN IF NOT EXISTS "food_category" VARCHAR(80);
    `);

    await prisma.$executeRawUnsafe(`
      UPDATE "food"
      SET "serving_unit" = CASE
        WHEN "serving_unit" IS NULL THEN NULL
        WHEN LOWER(TRIM("serving_unit")) IN ('100g', 'g', 'gramos') THEN '100g'
        WHEN LOWER(TRIM("serving_unit")) IN ('100ml', 'ml', 'mililitros') THEN '100ml'
        WHEN LOWER(TRIM("serving_unit")) IN ('porcion', 'unidad') THEN 'porcion'
        ELSE NULL
      END;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'chk_food_serving_unit'
        ) THEN
          ALTER TABLE "food"
          ADD CONSTRAINT "chk_food_serving_unit"
          CHECK (
            "serving_unit" IS NULL
            OR "serving_unit" IN ('100g', '100ml', 'porcion')
          );
        END IF;
      END $$;
    `);

    console.log('Manual migration 0014 applied');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Manual migration 0014 failed', error);
  process.exit(1);
});
