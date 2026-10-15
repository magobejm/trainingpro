import { BadRequestException, ConflictException } from '@nestjs/common';
import type { AuthContext } from '../../../src/common/auth-context/auth-context';
import type { PrismaService } from '../../../src/common/prisma/prisma.service';
import { countsAsDoneSession } from '../../../src/modules/clients/application/use-cases/get-client-calendar-summary.usecase';
import {
  SkipClientSessionUseCase,
  UndoClientSessionSkipUseCase,
  assertSkippableDate,
} from '../../../src/modules/clients/application/use-cases/skip-client-session.usecase';
import type { ClientsRepositoryPort } from '../../../src/modules/clients/domain/clients-repository.port';
import type { SessionsRepositoryPort } from '../../../src/modules/sessions/domain/sessions-repository.port';

const context = { activeRole: 'client', email: 'client@example.com', roles: ['client'], subject: 'user' } as AuthContext;
const now = new Date('2026-10-15T10:00:00.000Z');

describe('assertSkippableDate', () => {
  it('rejects a future calendar day', () => {
    expect(() => assertSkippableDate(new Date('2026-10-16T00:00:00.000Z'), now, 0)).toThrow(BadRequestException);
    expect(() => assertSkippableDate(new Date('2026-10-15T00:00:00.000Z'), now, 0)).not.toThrow();
  });
});

describe('SkipClientSessionUseCase', () => {
  it('rejects a workout that has already started', async () => {
    const updates: SkipUpdate[] = [];
    const useCase = new SkipClientSessionUseCase(
      clients(),
      sessions({ startedAt: now, status: 'IN_PROGRESS' }),
      prisma(updates),
    );
    await expect(
      useCase.execute(context, { offsetMinutes: 0, planDayId: PLAN_DAY, sessionDate: new Date('2026-10-15') }, now),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(updates).toEqual([]);
  });

  it('marks a pending workout and stores the optional reason', async () => {
    const updates: SkipUpdate[] = [];
    const useCase = new SkipClientSessionUseCase(
      clients(),
      sessions({ startedAt: null, status: 'PENDING' }),
      prisma(updates),
    );
    await expect(
      useCase.execute(
        context,
        { offsetMinutes: 0, planDayId: PLAN_DAY, reason: '  viaje  ', sessionDate: new Date('2026-10-14') },
        now,
      ),
    ).resolves.toEqual({ id: 'session-1' });
    expect(updates[0]?.data).toEqual({ skipReason: 'viaje', skippedAt: now });
  });
});

describe('UndoClientSessionSkipUseCase', () => {
  it('clears the skip so the client can change their mind', async () => {
    const updates: Array<{ data: { skipReason: null; skippedAt: null } }> = [];
    const useCase = new UndoClientSessionSkipUseCase(undoPrisma({ startedAt: null, status: 'PENDING' }, updates));
    await expect(useCase.execute(context, 'session-1')).resolves.toEqual({ id: 'session-1' });
    expect(updates[0]?.data).toEqual({ skipReason: null, skippedAt: null });
  });

  it('refuses to undo a session that already started', async () => {
    const updates: Array<{ data: { skipReason: null; skippedAt: null } }> = [];
    const useCase = new UndoClientSessionSkipUseCase(undoPrisma({ startedAt: now, status: 'IN_PROGRESS' }, updates));
    await expect(useCase.execute(context, 'session-1')).rejects.toBeInstanceOf(ConflictException);
    expect(updates).toEqual([]);
  });
});

describe('countsAsDoneSession', () => {
  it('keeps incomplete sessions out of completed days and the streak', () => {
    expect(countsAsDoneSession({ isCompleted: true, isIncomplete: true })).toBe(false);
    expect(countsAsDoneSession({ isCompleted: true, isIncomplete: false })).toBe(true);
  });
});

const PLAN_DAY = '11111111-1111-4111-8111-111111111111';

type SkipUpdate = { data: { skipReason: string | null; skippedAt: Date } };

function clients(): ClientsRepositoryPort {
  return {
    findClientByEmail: async () =>
      ({
        coachMembershipId: 'coach',
        id: 'client',
        organizationId: 'org',
        trainingPlanId: 'plan',
      }) as Awaited<ReturnType<ClientsRepositoryPort['findClientByEmail']>>,
    findClientPlanDayTemplateIdByEmail: async () => 'plan',
  } as unknown as ClientsRepositoryPort;
}

function sessions(row: { startedAt: Date | null; status: 'IN_PROGRESS' | 'PENDING' }): SessionsRepositoryPort {
  return {
    ensureSessionForClient: async () =>
      ({ id: 'session-1', ...row }) as Awaited<ReturnType<SessionsRepositoryPort['ensureSessionForClient']>>,
  } as unknown as SessionsRepositoryPort;
}

function prisma(updates: SkipUpdate[]): PrismaService {
  return {
    sessionInstance: {
      update: async (args: { data: { skipReason: string | null; skippedAt: Date } }) => {
        updates.push(args);
        return { id: 'session-1' };
      },
    },
  } as unknown as PrismaService;
}

function undoPrisma(
  row: { startedAt: Date | null; status: string },
  updates: Array<{ data: { skipReason: null; skippedAt: null } }>,
): PrismaService {
  return {
    client: { findFirst: async () => ({ id: 'client' }) },
    sessionInstance: {
      findFirst: async () => ({ id: 'session-1', ...row }),
      update: async (args: { data: { skipReason: null; skippedAt: null } }) => {
        updates.push(args);
        return { id: 'session-1' };
      },
    },
  } as unknown as PrismaService;
}
