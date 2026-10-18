import { PrismaClient } from '@prisma/client';
import { captureLegacyAssignments } from '../src/modules/plans/infra/prisma/routine-revision.prisma';

/** Run after migrations and before enabling template editing on the upgraded API. Idempotent. */
async function main() {
  const db = new PrismaClient();
  try {
    const clients = await db.client.findMany({
      where: { trainingPlanId: { not: null }, activeRoutineAssignmentId: null },
      select: { trainingPlanId: true },
    });
    const ids = [...new Set(clients.map((client) => client.trainingPlanId!))].sort();
    for (const id of ids)
      await db.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM plan_template WHERE id = ${id}::uuid FOR UPDATE`;
          await captureLegacyAssignments(tx, id);
        },
        { maxWait: 10000, timeout: 30000 },
      );
    console.info(`Captured initial assignments for ${ids.length} routines`);
  } finally {
    await db.$disconnect();
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
