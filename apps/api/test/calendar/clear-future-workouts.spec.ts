import { ForbiddenException } from '@nestjs/common';
import { ClearFutureWorkoutsUseCase } from '../../src/modules/calendar/application/use-cases/clear-future-workouts.usecase';
import { selectWorkoutIdsToClear } from '../../src/modules/calendar/domain/clear-future-workouts';

const FROM = '2026-10-08';
const CLIENT = '11111111-1111-1111-1111-111111111111';

describe('selectWorkoutIdsToClear', () => {
  it('archives future and today undone workouts and keeps notes, the past, and a completed today', () => {
    const events = [
      { id: 'future', type: 'workout', date: '2026-10-15', clientId: CLIENT },
      { id: 'today', type: 'workout', date: '2026-10-08', clientId: CLIENT },
      { id: 'note', type: 'note', date: '2026-10-15', clientId: CLIENT },
      { id: 'reminder', type: 'reminder', date: '2026-10-20', clientId: CLIENT },
      { id: 'past', type: 'workout', date: '2026-10-01', clientId: CLIENT },
    ];

    expect(selectWorkoutIdsToClear(events, new Set(), FROM)).toEqual(['future', 'today']);
    expect(selectWorkoutIdsToClear(events, new Set([`${CLIENT}|2026-10-08`]), FROM)).toEqual(['future']);
  });
});

describe('ClearFutureWorkoutsUseCase', () => {
  const prisma = {
    organizationMember: { findFirst: jest.fn() },
    client: { findFirst: jest.fn() },
    calendarEvent: { findMany: jest.fn(), updateMany: jest.fn() },
    sessionInstance: { findMany: jest.fn() },
  };
  const coach = { activeRole: 'coach' as const, roles: ['coach' as const], subject: 'coach-uid' };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: 'membership-1' });
    prisma.client.findFirst.mockResolvedValue({ id: CLIENT });
    prisma.calendarEvent.updateMany.mockResolvedValue({ count: 2 });
  });

  it('archives only the workouts the selector returns', async () => {
    prisma.calendarEvent.findMany.mockResolvedValue([
      { id: 'future', type: 'workout', date: new Date('2026-10-15T00:00:00.000Z'), clientId: CLIENT },
      { id: 'today-open', type: 'workout', date: new Date('2026-10-08T00:00:00.000Z'), clientId: CLIENT },
      { id: 'note', type: 'note', date: new Date('2026-10-15T00:00:00.000Z'), clientId: CLIENT },
    ]);
    prisma.sessionInstance.findMany.mockResolvedValue([]);

    const archived = await new ClearFutureWorkoutsUseCase(prisma as never).execute(coach, {
      clientId: CLIENT,
      from: FROM,
    });

    expect(archived).toEqual({ archived: 2 });
    expect(prisma.calendarEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ['future', 'today-open'] }, clientId: CLIENT }),
      }),
    );
  });

  it('rejects a non-coach', async () => {
    const client = { activeRole: 'client' as const, roles: ['client' as const], subject: 'client-uid' };
    await expect(
      new ClearFutureWorkoutsUseCase(prisma as never).execute(client, { clientId: CLIENT, from: FROM }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
