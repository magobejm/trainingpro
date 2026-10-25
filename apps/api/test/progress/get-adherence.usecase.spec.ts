import { GetAdherenceUseCase } from '../../src/modules/progress/application/use-cases/get-adherence.usecase';
import type { AuthContext } from '../../src/common/auth-context/auth-context';

const dates = { from: new Date('2026-10-01'), to: new Date('2026-10-02') };
const coach = { activeRole: 'coach', subject: 'coach-subject' } as AuthContext;

describe('adherence authorization and empty agenda', () => {
  it('requires a coach client selection before querying data', async () => {
    const prisma = { client: { findFirst: jest.fn() } };
    await expect(new GetAdherenceUseCase(prisma as never).execute(coach, dates)).rejects.toThrow('clientId is required');
    expect(prisma.client.findFirst).not.toHaveBeenCalled();
  });
  it('does not read another coach client agenda', async () => {
    const prisma = { client: { findFirst: jest.fn().mockResolvedValue(null) }, calendarEvent: { findMany: jest.fn() } };
    await expect(new GetAdherenceUseCase(prisma as never).execute(coach, { ...dates, clientId: 'foreign' })).rejects.toThrow(
      'Client not found',
    );
    expect(prisma.client.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'foreign',
          coachMembership: expect.objectContaining({ user: { supabaseUid: 'coach-subject' } }),
        }),
      }),
    );
    expect(prisma.calendarEvent.findMany).not.toHaveBeenCalled();
  });
  it('reports no registered agenda instead of manufacturing planned workouts', async () => {
    const prisma = {
      client: { findFirst: jest.fn().mockResolvedValue({ id: 'client' }) },
      calendarEvent: { findMany: jest.fn().mockResolvedValue([]) },
      sessionInstance: { findMany: jest.fn().mockResolvedValue([]) },
      clientNeatLog: { count: jest.fn().mockResolvedValue(0) },
    };
    const result = await new GetAdherenceUseCase(prisma as never).execute(coach, { ...dates, clientId: 'client' });
    expect(result).toMatchObject({
      percent: null,
      plannedCount: 0,
      cutoffDate: '2026-10-02',
      neat: { done: 0, expected: 0, percent: null },
    });
    expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ clientId: { in: ['client'] }, type: 'workout', archivedAt: null }),
      }),
    );
  });
});
