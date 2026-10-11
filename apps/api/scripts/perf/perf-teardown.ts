import { PrismaClient } from '@prisma/client';
import { PERF_ORG_ID } from './perf-config';

export async function removePerfOrganization(db: PrismaClient = prisma): Promise<void> {
  const org = PERF_ORG_ID;
  await db.$executeRaw`
    DELETE FROM set_log WHERE session_id IN (SELECT id FROM session_instance WHERE organization_id = ${org}::uuid)
  `;
  await db.$executeRaw`
    DELETE FROM session_strength_item
    WHERE session_id IN (SELECT id FROM session_instance WHERE organization_id = ${org}::uuid)
  `;
  await db.$executeRaw`DELETE FROM session_instance WHERE organization_id = ${org}::uuid`;
  await db.$executeRaw`
    DELETE FROM chat_message WHERE thread_id IN (SELECT id FROM chat_thread WHERE organization_id = ${org}::uuid)
  `;
  await db.$executeRaw`DELETE FROM chat_thread WHERE organization_id = ${org}::uuid`;
  await db.$executeRaw`
    DELETE FROM calendar_event WHERE coach_membership_id IN (
      SELECT id FROM organization_member WHERE organization_id = ${org}::uuid
    )
  `;
  await db.$executeRaw`
    DELETE FROM client_progress_photo WHERE client_id IN (SELECT id FROM client WHERE organization_id = ${org}::uuid)
  `;
  await db.$executeRaw`DELETE FROM client WHERE organization_id = ${org}::uuid`;
  await db.$executeRaw`DELETE FROM plan_template WHERE organization_id = ${org}::uuid`;
  await db.$executeRaw`DELETE FROM warmup_template WHERE organization_id = ${org}::uuid`;
  await db.$executeRaw`DELETE FROM exercise WHERE organization_id = ${org}::uuid`;
  await db.$executeRaw`DELETE FROM food WHERE organization_id = ${org}::uuid`;
  await db.$executeRaw`DELETE FROM cardio_method WHERE organization_id = ${org}::uuid`;
  await db.$executeRaw`DELETE FROM plio_exercise WHERE organization_id = ${org}::uuid`;
  await db.$executeRaw`DELETE FROM mobility_exercise WHERE organization_id = ${org}::uuid`;
  await db.$executeRaw`DELETE FROM isometric_exercise WHERE organization_id = ${org}::uuid`;
  await db.$executeRaw`DELETE FROM sport WHERE organization_id = ${org}::uuid`;
  await db.$executeRaw`DELETE FROM organization_member WHERE organization_id = ${org}::uuid`;
  await db.$executeRaw`DELETE FROM organization WHERE id = ${org}::uuid`;
  await db.$executeRaw`
    DELETE FROM user_account WHERE email IN ('perf-coach@perf.local', 'perf-other@perf.local')
  `;
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await removePerfOrganization(prisma);
    console.log('Organización perf eliminada.');
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.includes('perf-teardown')) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'perf-teardown failed');
    process.exitCode = 1;
  });
}
