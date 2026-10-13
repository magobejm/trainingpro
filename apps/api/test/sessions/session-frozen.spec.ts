import { BadRequestException } from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import { persistEnsuredSession } from '../../src/modules/sessions/infra/prisma/session-ensure';
import { assertSessionMutable } from '../../src/modules/sessions/infra/prisma/sessions-prisma.mappers';

const AUTH: AuthContext = { activeRole: 'coach', roles: ['coach'], subject: 'coach-a' };

describe('frozen session', () => {
  it('rejects a write on a completed session and allows one in progress', () => {
    expect(() => assertSessionMutable(SessionStatus.COMPLETED)).toThrow(BadRequestException);
    expect(() => assertSessionMutable(SessionStatus.IN_PROGRESS)).not.toThrow();
  });

  it('returns the started session of the same plan day and does not load the template', async () => {
    const existing = sessionRow({ archivedAt: null, planDayId: 'day-1', status: SessionStatus.IN_PROGRESS });
    const saved = await ensure(existing, 'day-1');
    expect(saved.result).toBe(existing);
    expect(saved.loadTemplate).not.toHaveBeenCalled();
    expect(saved.update).not.toHaveBeenCalled();
    expect(saved.create).not.toHaveBeenCalled();
  });

  it('does not rewrite a started session of the same plan day that was archived', async () => {
    const existing = sessionRow({
      archivedAt: new Date('2026-09-07T12:00:00.000Z'),
      planDayId: 'day-1',
      status: SessionStatus.IN_PROGRESS,
    });
    const saved = await ensure(existing, 'day-1');
    expect(saved.result).toBe(existing);
    expect(saved.loadTemplate).not.toHaveBeenCalled();
    expect(saved.update).not.toHaveBeenCalled();
  });

  it('creates another session when the plan day is different', async () => {
    const existing = sessionRow({ archivedAt: null, planDayId: 'day-1', status: SessionStatus.IN_PROGRESS });
    const saved = await ensure(existing, 'day-2');
    expect(saved.result).toEqual({ id: 'created' });
    expect(saved.loadTemplate).toHaveBeenCalled();
    expect(saved.create).toHaveBeenCalled();
    expect(saved.update).not.toHaveBeenCalled();
  });
});

function sessionRow(overrides: { archivedAt: Date | null; planDayId: string; status: SessionStatus }) {
  return {
    archivedAt: overrides.archivedAt,
    id: 'session-1',
    planDayId: overrides.planDayId,
    startedAt: new Date('2026-09-07T10:00:00.000Z'),
    status: overrides.status,
  };
}

async function ensure(existing: ReturnType<typeof sessionRow>, planDayId: string) {
  const deleteMany = jest.fn();
  const update = jest.fn();
  const create = jest.fn().mockResolvedValue({ id: 'created' });
  const tx = {
    sessionCardioBlock: { deleteMany },
    sessionInstance: {
      create,
      findFirst: async (query: { where: { planDayId?: string | null } }) => {
        if (query.where.planDayId === existing.planDayId) return existing;
        return null;
      },
      update,
    },
    sessionIsometricBlock: { deleteMany },
    sessionMobilityBlock: { deleteMany },
    sessionPlioBlock: { deleteMany },
    sessionSportBlock: { deleteMany },
    sessionStrengthItem: { deleteMany },
  };
  const prisma = { $transaction: async (run: (client: typeof tx) => Promise<unknown>) => run(tx) };
  const loadTemplate = jest.fn().mockResolvedValue({
    id: 'template',
    isometricBlocks: [],
    items: [],
    mobilityBlocks: [],
    planDaySnapshot: { planDayId, planDayIndex: 2, planDayTitle: 'Día 2' },
    plioBlocks: [],
    sportBlocks: [],
    templateVersion: 1,
  });
  const result = await persistEnsuredSession(
    prisma as unknown as PrismaService,
    AUTH,
    { clientId: 'client', planDayId, sessionDate: new Date('2026-09-07T00:00:00.000Z'), templateId: 'template' },
    { id: 'membership', organizationId: 'org' },
    loadTemplate,
  );
  return { create, deleteMany, loadTemplate, result, update };
}
