/* eslint-disable no-console */
/**
 * Dev-only seed: creates the org → coach → client hierarchy
 * for local testing with the default test users.
 *
 * Safe to re-run (all upserts are idempotent).
 *
 * Prerequisites: run `pnpm --filter @trainerpro/api db:seed` first
 * so that ClientObjective and PlanTemplate catalog rows exist.
 *
 * Test users (passwords stored in the team password manager):
 *   Coach  → coach1@example.com
 *   Client → client5.coach1@example.com
 */
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Supabase auth UIDs (from local Supabase instance)
const COACH_SUPABASE_UID = '3260bd52-fdde-40bb-88fe-598bfc7f12dd';

// Stable IDs so the seed is fully idempotent
const ORG_ID = '10000000-0000-4000-8000-000000000001';
const COACH_USER_ID = '20000000-0000-4000-8000-000000000001';
const COACH_MEMBERSHIP_ID = '30000000-0000-4000-8000-000000000001';
const CLIENT_ID = '40000000-0000-4000-8000-000000000001';

// Global routine template created by the library seed
const GLOBAL_TEMPLATE_ID = '00000072-0001-0000-0000-000000000001';

async function main(): Promise<void> {
  console.log('→ Seeding dev data (org / coach / client)...');

  // 1. Organization
  await prisma.organization.upsert({
    where: { id: ORG_ID },
    create: { id: ORG_ID, name: 'Test Gym' },
    update: { name: 'Test Gym' },
  });
  console.log('  ✓ Organization');

  // 2. User account for coach1@example.com
  await prisma.user.upsert({
    where: { supabaseUid: COACH_SUPABASE_UID },
    create: {
      id: COACH_USER_ID,
      email: 'coach1@example.com',
      supabaseUid: COACH_SUPABASE_UID,
      isActive: true,
    },
    update: { email: 'coach1@example.com', isActive: true },
  });
  console.log('  ✓ User account (coach)');

  // 3. OrganizationMember (coach role)
  await prisma.organizationMember.upsert({
    where: { id: COACH_MEMBERSHIP_ID },
    create: {
      id: COACH_MEMBERSHIP_ID,
      organizationId: ORG_ID,
      userId: COACH_USER_ID,
      role: Role.COACH,
      isActive: true,
    },
    update: { isActive: true },
  });
  console.log('  ✓ OrganizationMember (coach)');

  // 4. Resolve a ClientObjective (must exist from library seed)
  const objective = await prisma.clientObjective.findFirst({
    where: { isDefault: true },
    select: { id: true },
  });
  if (!objective) {
    throw new Error('No ClientObjective found. Run `pnpm --filter @trainerpro/api db:seed` first.');
  }

  // 5. Resolve plan template (use global template if it exists, else any)
  const planTemplate =
    (await prisma.planTemplate.findFirst({
      where: { id: GLOBAL_TEMPLATE_ID },
      select: { id: true },
    })) ??
    (await prisma.planTemplate.findFirst({
      where: { scope: 'GLOBAL' },
      select: { id: true },
    }));

  // 6. Client for client5.coach1@example.com
  await prisma.client.upsert({
    where: { id: CLIENT_ID },
    create: {
      id: CLIENT_ID,
      organizationId: ORG_ID,
      coachMembershipId: COACH_MEMBERSHIP_ID,
      email: 'client5.coach1@example.com',
      firstName: 'Cliente',
      lastName: 'Cinco',
      objectiveId: objective.id,
      trainingPlanId: planTemplate?.id ?? null,
      createdBy: COACH_SUPABASE_UID,
      updatedBy: COACH_SUPABASE_UID,
    },
    update: {
      coachMembershipId: COACH_MEMBERSHIP_ID,
      trainingPlanId: planTemplate?.id ?? null,
    },
  });
  console.log(`  ✓ Client (client5.coach1@example.com) — plan: ${planTemplate?.id ?? 'none'}`);

  console.log('');
  console.log('Dev data ready.');
  console.log(`  Org:    ${ORG_ID}`);
  console.log(`  Coach membership: ${COACH_MEMBERSHIP_ID}`);
  console.log(`  Client: ${CLIENT_ID}`);
  if (!planTemplate) {
    console.log('  ⚠ No PlanTemplate found — run db:seed first, then db:seed:dev again.');
  }
}

main()
  .catch((err) => {
    console.error('Dev seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
