import { ForbiddenException, ConflictException } from '@nestjs/common';
import { ClearFutureWorkoutsUseCase } from '../../src/modules/calendar/application/use-cases/clear-future-workouts.usecase';
import { applyRoutineHandoff, readHandoffPreview } from '../../src/modules/calendar/infra/prisma/routine-handoff.prisma';

const FROM = '2026-10-16';
const CLIENT = '11111111-1111-4111-8111-111111111111';
const coach = { activeRole: 'coach' as const, roles: ['coach' as const], subject: 'coach-uid' };
function fixture() {
  const prisma = {
    organizationMember: { findFirst: jest.fn().mockResolvedValue({ id: 'coach' }) },
    client: {
      findFirst: jest.fn().mockResolvedValue({ id: CLIENT }),
      findFirstOrThrow: jest.fn().mockResolvedValue({ trainingPlanId: 'old' }),
    },
    calendarEvent: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'pending',
          type: 'workout',
          date: new Date(FROM),
          clientId: CLIENT,
          planDayId: 'a',
          title: 'A',
          updatedAt: new Date(FROM),
        },
        {
          id: 'started',
          type: 'workout',
          date: new Date(FROM),
          clientId: CLIENT,
          planDayId: 'b',
          title: 'B',
          updatedAt: new Date(FROM),
        },
      ]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    sessionInstance: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'session',
          sessionDate: new Date(FROM),
          planDayId: 'b',
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          isCompleted: false,
          isIncomplete: false,
        },
      ]),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((run: (tx: typeof prisma) => unknown) => run(prisma));
  return prisma;
}
describe('routine handoff preview and clearing', () => {
  it('simulates without writes or row locks', async () => {
    const db = fixture();
    const preview = await new ClearFutureWorkoutsUseCase(db as never).execute(coach, {
      clientId: CLIENT,
      from: FROM,
      dryRun: true,
    });
    expect(preview).toMatchObject({
      currentRoutineId: 'old',
      removable: [{ id: 'pending' }],
      preserved: [{ id: 'started', reason: 'started' }],
    });
    expect(db.calendarEvent.updateMany).not.toHaveBeenCalled();
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });
  it('keeps legacy response and protects only the started workout', async () => {
    const db = fixture();
    expect(await new ClearFutureWorkoutsUseCase(db as never).execute(coach, { clientId: CLIENT, from: FROM })).toEqual({
      archived: 1,
    });
    expect(db.calendarEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: { in: ['pending'] } }) }),
    );
    expect(db.$queryRaw).toHaveBeenCalledTimes(3);
  });
  it('rejects non-coaches and inaccessible clients', async () => {
    const db = fixture();
    const useCase = new ClearFutureWorkoutsUseCase(db as never);
    await expect(
      useCase.execute({ ...coach, activeRole: 'client' }, { clientId: CLIENT, from: FROM, dryRun: true }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    db.client.findFirst.mockResolvedValue(null);
    await expect(useCase.execute(coach, { clientId: CLIENT, from: FROM, dryRun: true })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('rejects a changed snapshot without writes', async () => {
    const db = fixture();
    const before = await readHandoffPreview(db as never, 'coach', CLIENT, FROM);
    db.client.findFirstOrThrow.mockResolvedValue({ trainingPlanId: 'changed' });
    await expect(
      applyRoutineHandoff(db as never, 'coach', CLIENT, {
        mode: 'replace',
        from: FROM,
        expectedSignature: before.signature,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(db.calendarEvent.updateMany).not.toHaveBeenCalled();
  });
  it('does not clear any events when continuing', async () => {
    const db = fixture();
    const before = await readHandoffPreview(db as never, 'coach', CLIENT, FROM);
    await applyRoutineHandoff(db as never, 'coach', CLIENT, {
      mode: 'continue',
      from: FROM,
      expectedSignature: before.signature,
    });
    expect(db.calendarEvent.updateMany).not.toHaveBeenCalled();
  });
});
