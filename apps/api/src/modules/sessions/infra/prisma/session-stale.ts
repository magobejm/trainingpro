import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import { withLockedSession } from './session-lock';

export const STALE_SESSION_MS = 6 * 60 * 60 * 1000;
type StaleScope = { clientId?: string; coachMembershipId?: string; sessionId?: string };

/** Candidate reads are advisory; state and activity are reloaded under the session lock. */
export async function closeStaleSessions(prisma: PrismaService, scope: StaleScope, now = new Date()): Promise<void> {
  if (!scope.clientId && !scope.coachMembershipId && !scope.sessionId) return;
  const cutoff = new Date(now.getTime() - STALE_SESSION_MS);
  const where = {
    archivedAt: null,
    startedAt: { lte: cutoff },
    status: 'IN_PROGRESS' as const,
    ...(scope.clientId ? { clientId: scope.clientId } : {}),
    ...(scope.coachMembershipId ? { coachMembershipId: scope.coachMembershipId } : {}),
    ...(scope.sessionId ? { id: scope.sessionId } : {}),
  };
  const candidates = await prisma.sessionInstance.findMany({ select: { id: true }, where });
  // Keep transactions short and hold only one session lock at a time.
  for (const candidate of candidates) {
    await withLockedSession(prisma, candidate.id, async (tx) => {
      const current = await tx.sessionInstance.findFirst({
        select: { id: true, startedAt: true },
        where: { ...where, id: candidate.id },
      });
      if (!current?.startedAt) return;
      const activity = await latestActivity(tx, [current.id]);
      const finishedAt = activity.get(current.id) ?? current.startedAt;
      if (finishedAt > cutoff) return;
      await tx.sessionInstance.updateMany({
        data: { finishedAt, isCompleted: true, isIncomplete: true, status: 'COMPLETED' },
        where: { ...where, id: current.id },
      });
    });
  }
}

async function latestActivity(prisma: Prisma.TransactionClient, sessionIds: string[]): Promise<Map<string, Date>> {
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
