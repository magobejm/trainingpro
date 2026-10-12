import type { PrismaService } from '../../../../common/prisma/prisma.service';

type Activity = { clientId: string; at: Date | null };
export function mergeLastActivities(rows: Activity[]): Map<string, Date> {
  const result = new Map<string, Date>();
  for (const row of rows) {
    if (row.at && (!result.has(row.clientId) || row.at.getTime() > result.get(row.clientId)!.getTime())) {
      result.set(row.clientId, row.at);
    }
  }
  return result;
}

/** MAX(COALESCE(finishedAt, sessionDate)), limitado a clientes previamente autorizados. */
export async function readLastClientActivities(prisma: PrismaService, clientIds: string[]): Promise<Map<string, Date>> {
  if (!clientIds.length) return new Map();
  const where = { clientId: { in: clientIds }, archivedAt: null, isCompleted: true };
  const [finished, legacy] = await Promise.all([
    prisma.sessionInstance.groupBy({ by: ['clientId'], where, _max: { finishedAt: true } }),
    prisma.sessionInstance.groupBy({ by: ['clientId'], where: { ...where, finishedAt: null }, _max: { sessionDate: true } }),
  ]);
  return mergeLastActivities([
    ...finished.map((row) => ({ clientId: row.clientId, at: row._max.finishedAt })),
    ...legacy.map((row) => ({ clientId: row.clientId, at: row._max.sessionDate })),
  ]);
}
