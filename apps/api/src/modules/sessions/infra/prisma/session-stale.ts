import type { PrismaService } from '../../../../common/prisma/prisma.service';

export const STALE_SESSION_MS = 6 * 60 * 60 * 1000;

type StaleScope = {
  clientId?: string;
  coachMembershipId?: string;
  sessionId?: string;
};

type OpenSession = { id: string; startedAt: Date | null };

/** Cierra como incompletas las sesiones en curso cuya última serie tiene más de 6 horas. */
export async function closeStaleSessions(prisma: PrismaService, scope: StaleScope, now = new Date()): Promise<void> {
  if (!scope.clientId && !scope.coachMembershipId && !scope.sessionId) return;
  const cutoff = new Date(now.getTime() - STALE_SESSION_MS);
  const open = await prisma.sessionInstance.findMany({
    select: { id: true, startedAt: true },
    where: {
      archivedAt: null,
      startedAt: { lte: cutoff },
      status: 'IN_PROGRESS',
      ...(scope.clientId ? { clientId: scope.clientId } : {}),
      ...(scope.coachMembershipId ? { coachMembershipId: scope.coachMembershipId } : {}),
      ...(scope.sessionId ? { id: scope.sessionId } : {}),
    },
  });
  const stale = await staleSessions(prisma, open, cutoff);
  await Promise.all(stale.map((row) => closeOne(prisma, row)));
}

async function staleSessions(
  prisma: PrismaService,
  open: OpenSession[],
  cutoff: Date,
): Promise<Array<{ finishedAt: Date; id: string }>> {
  if (open.length === 0) return [];
  const activity = await latestActivity(
    prisma,
    open.map((row) => row.id),
  );
  return open.flatMap((row) => {
    const finishedAt = activity.get(row.id) ?? row.startedAt;
    if (!finishedAt || finishedAt.getTime() > cutoff.getTime()) return [];
    return [{ finishedAt, id: row.id }];
  });
}

async function latestActivity(prisma: PrismaService, sessionIds: string[]): Promise<Map<string, Date>> {
  const select = { sessionId: true, updatedAt: true } as const;
  const where = { sessionId: { in: sessionIds } };
  const lists = await Promise.all([
    prisma.setLog.findMany({ select, where }),
    prisma.intervalLog.findMany({ select, where }),
    prisma.plioSetLog.findMany({ select, where }),
    prisma.mobilitySetLog.findMany({ select, where }),
    prisma.isometricSetLog.findMany({ select, where }),
    prisma.sportSessionLog.findMany({ select, where }),
    prisma.sportSetLog.findMany({ select, where }),
  ]);
  const latest = new Map<string, Date>();
  for (const row of lists.flat()) {
    const current = latest.get(row.sessionId);
    if (!current || row.updatedAt > current) latest.set(row.sessionId, row.updatedAt);
  }
  return latest;
}

function closeOne(prisma: PrismaService, row: { finishedAt: Date; id: string }): Promise<unknown> {
  return prisma.sessionInstance.updateMany({
    data: { finishedAt: row.finishedAt, isCompleted: true, isIncomplete: true, status: 'COMPLETED' },
    where: { id: row.id, status: 'IN_PROGRESS' },
  });
}
