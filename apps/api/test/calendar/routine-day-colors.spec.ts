import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import { ClientRoutineColorsService } from '../../src/modules/clients/application/services/client-routine-colors.service';

describe('client routine day colors', () => {
  const saved = new Map<string, { planDayId: string; color: string }>();
  const db = {
    $queryRaw: jest.fn(),
    client: { findUniqueOrThrow: jest.fn() },
    planDay: { findFirst: jest.fn() },
    clientRoutineDayColor: {
      findMany: jest.fn(async ({ where }) =>
        [...saved.entries()].filter(([key]) => key.startsWith(where.clientId + ':')).map(([, row]) => row),
      ),
      upsert: jest.fn(async ({ create }) => {
        saved.set(create.clientId + ':' + create.planDayId, create);
        return create;
      }),
    },
    $transaction: async (work: (tx: unknown) => unknown) => work(db),
  };
  const service = () => new ClientRoutineColorsService(db as unknown as PrismaService);
  beforeEach(() => {
    saved.clear();
    jest.clearAllMocks();
    db.client.findUniqueOrThrow.mockResolvedValue({
      trainingPlanId: 'routine',
      archivedAt: null,
      activeRoutineAssignment: null,
    });
    db.planDay.findFirst.mockResolvedValue({ id: 'day' });
  });

  it('remembers a selection across service instances and isolates clients', async () => {
    await service().save('one', 'day', '#e2e8f0');
    await service().save('two', 'day', '#dbeafe');
    expect(await service().list('one')).toEqual({ colors: [{ planDayId: 'day', color: '#e2e8f0' }] });
    expect(await service().list('two')).toEqual({ colors: [{ planDayId: 'day', color: '#dbeafe' }] });
    await service().save('one', 'day', '#fef3c7');
    expect(saved.size).toBe(2);
  });

  it('rejects a day outside the assigned routine without writing', async () => {
    db.planDay.findFirst.mockResolvedValue(null);
    await expect(service().save('one', 'foreign-day', '#e2e8f0')).rejects.toBeInstanceOf(BadRequestException);
    expect(db.clientRoutineDayColor.upsert).not.toHaveBeenCalled();
  });

  it('validates against the applied revision, including archived days', async () => {
    db.client.findUniqueOrThrow.mockResolvedValue({
      archivedAt: null,
      trainingPlanId: 'routine',
      activeRoutineAssignment: { revision: { content: { days: [{ id: 'archived-day' }] } } },
    });
    await service().save('one', 'archived-day', '#e2e8f0');
    await expect(service().save('one', 'new-unassigned-day', '#e2e8f0')).rejects.toBeInstanceOf(BadRequestException);
    expect(db.planDay.findFirst).not.toHaveBeenCalled();
  });
});
