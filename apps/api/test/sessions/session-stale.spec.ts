import { NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import { SessionsRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions.repository.prisma';
import { closeStaleSessions } from '../../src/modules/sessions/infra/prisma/session-stale';
import type { SessionsCardioRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions-cardio.repository.prisma';

const HOUR = 60 * 60 * 1000;
const context = { activeRole: 'client', roles: ['client'], subject: 'user' } as AuthContext;

describe('closeStaleSessions', () => {
  it('leaves a session open five hours after it started', async () => {
    const now = new Date('2026-10-15T12:00:00.000Z');
    const { prisma, updates } = harness(new Date(now.getTime() - 5 * HOUR));
    await closeStaleSessions(prisma, { clientId: 'client' }, now);
    expect(updates).toEqual([]);
  });

  it('closes a session that has had no sets for seven hours and freezes the clock at the start', async () => {
    const now = new Date('2026-10-15T12:00:00.000Z');
    const startedAt = new Date(now.getTime() - 7 * HOUR);
    const { prisma, updates } = harness(startedAt);
    await closeStaleSessions(prisma, { sessionId: 'session-1' }, now);
    expect(updates).toEqual([
      expect.objectContaining({
        data: expect.objectContaining({ finishedAt: startedAt, isCompleted: true, isIncomplete: true, status: 'COMPLETED' }),
        where: { id: 'session-1', status: 'IN_PROGRESS' },
      }),
    ]);
  });

  it('keeps the session open when a set was saved inside the last six hours', async () => {
    const now = new Date('2026-10-15T12:00:00.000Z');
    const { prisma, updates } = harness(new Date(now.getTime() - 8 * HOUR), [
      { sessionId: 'session-1', updatedAt: new Date(now.getTime() - HOUR) },
    ]);
    await closeStaleSessions(prisma, { clientId: 'client' }, now);
    expect(updates).toEqual([]);
  });

  it('stops the clock at the last saved set', async () => {
    const now = new Date('2026-10-15T12:00:00.000Z');
    const lastSet = new Date(now.getTime() - 7 * HOUR);
    const { prisma, updates } = harness(new Date(now.getTime() - 10 * HOUR), [
      { sessionId: 'session-1', updatedAt: lastSet },
    ]);
    await closeStaleSessions(prisma, { clientId: 'client' }, now);
    expect(updates[0]?.data.finishedAt).toEqual(lastSet);
  });
});

describe('startSession skip mark', () => {
  it('clears the skip when the client starts the workout', async () => {
    const captured: Array<Record<string, unknown>> = [];
    let reads = 0;
    const prisma = {
      sessionInstance: {
        findFirst: async () => {
          reads += 1;
          return reads === 1 ? { id: 'session-1', startedAt: null, status: 'PENDING' } : null;
        },
        findMany: async () => [],
        updateMany: async (args: { data: Record<string, unknown> }) => {
          captured.push(args.data);
          return { count: 1 };
        },
      },
    } as unknown as PrismaService;
    const repo = new SessionsRepositoryPrisma(prisma, {} as SessionsCardioRepositoryPrisma);
    await expect(repo.startSession(context, { sessionId: 'session-1' })).rejects.toBeInstanceOf(NotFoundException);
    expect(captured[0]).toEqual(expect.objectContaining({ skipReason: null, skippedAt: null, status: 'IN_PROGRESS' }));
  });
});

type CloseUpdate = {
  data: { finishedAt: Date; isCompleted: boolean; isIncomplete: boolean; status: string };
  where: { id: string };
};

function harness(startedAt: Date, logs: Array<{ sessionId: string; updatedAt: Date }> = []) {
  const updates: CloseUpdate[] = [];
  const prisma = {
    intervalLog: { findMany: async () => [] },
    isometricSetLog: { findMany: async () => [] },
    mobilitySetLog: { findMany: async () => [] },
    plioSetLog: { findMany: async () => [] },
    sessionInstance: {
      findMany: async (args: { where: { startedAt: { lte: Date } } }) =>
        startedAt <= args.where.startedAt.lte ? [{ id: 'session-1', startedAt }] : [],
      updateMany: async (args: CloseUpdate) => {
        updates.push(args);
        return { count: 1 };
      },
    },
    setLog: { findMany: async () => logs },
    sportSessionLog: { findMany: async () => [] },
    sportSetLog: { findMany: async () => [] },
  };
  return { prisma: prisma as unknown as PrismaService, updates };
}
