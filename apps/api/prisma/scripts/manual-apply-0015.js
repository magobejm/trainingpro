import { PrismaClient } from '@prisma/client';

async function setupColumns(prisma) {
  await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'plan_template' AND column_name = 'scope'
        ) THEN
          ALTER TABLE "plan_template"
          ADD COLUMN "scope" "LibraryItemScope" NOT NULL DEFAULT 'COACH';
        END IF;
      END $$;
    `);

  const columns = ['organization_id', 'coach_membership_id', 'created_by', 'updated_by'];
  for (const col of columns) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "plan_template"
      ALTER COLUMN "${col}" DROP NOT NULL;
    `);
  }
}

async function setupConstraints(prisma) {
  await prisma.$executeRawUnsafe(`
      DO $$
      DECLARE
        fk_name TEXT;
      BEGIN
        -- Drop organization FK
        SELECT conname INTO fk_name
        FROM pg_constraint
        WHERE conrelid = 'plan_template'::regclass
          AND confrelid = 'organization'::regclass;
        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "plan_template" DROP CONSTRAINT "' || fk_name || '"';
        END IF;

        -- Drop coach_membership FK
        SELECT conname INTO fk_name
        FROM pg_constraint
        WHERE conrelid = 'plan_template'::regclass
          AND confrelid = 'organization_member'::regclass;
        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "plan_template" DROP CONSTRAINT "' || fk_name || '"';
        END IF;
      END $$;
    `);
}

async function finalizeMigration(prisma) {
  await prisma.$executeRawUnsafe(`
      ALTER TABLE "plan_template"
      ADD CONSTRAINT "plan_template_organization_id_fkey"
      FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL;
    `);

  await prisma.$executeRawUnsafe(`
      ALTER TABLE "plan_template"
      ADD CONSTRAINT "plan_template_coach_membership_id_fkey"
      FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL;
    `);

  await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_plan_template_scope_archived"
      ON "plan_template"("scope", "archived_at");
    `);
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await setupColumns(prisma);
    await setupConstraints(prisma);
    await finalizeMigration(prisma);
    console.log('Manual migration 0015 applied: PlanTemplate made nullable for GLOBAL routines');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Manual migration 0015 failed', error);
  process.exit(1);
});

main().catch((error) => {
  console.error('Manual migration 0015 failed', error);
  process.exit(1);
});
