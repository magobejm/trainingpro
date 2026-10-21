import { FirstWorkoutGuideService } from '../../src/modules/clients/application/services/first-workout-guide.service';
import type { PrismaService } from '../../src/common/prisma/prisma.service';

const context = { activeRole: 'client' as const, email: 'client@example.test', roles: ['client' as const], subject: 'uid' };
function setup() {
  const row = { id: 'client-1', firstWorkoutGuide: null, archivedAt: null };
  const db = {
    client: {
      findFirst: jest.fn().mockResolvedValue(row),
      findUniqueOrThrow: jest.fn().mockResolvedValue(row),
      update: jest.fn().mockResolvedValue(row),
    },
    sessionInstance: { findFirst: jest.fn().mockResolvedValue(null) },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  db.$transaction.mockImplementation((fn) => fn(db));
  return { db, service: new FirstWorkoutGuideService(db as unknown as PrismaService) };
}
describe('client first workout guide', () => {
  it('requires a client profile and client role', async () => {
    const { db, service } = setup();
    await expect(service.get({ ...context, activeRole: 'coach' })).rejects.toThrow();
    expect(db.client.findFirst).not.toHaveBeenCalled();
    db.client.findFirst.mockResolvedValue(null);
    await expect(service.get(context)).rejects.toThrow();
  });
  it('checks all active session history without a date cutoff or GET writes', async () => {
    const { db, service } = setup();
    expect((await service.get(context)).eligibleForAutoStart).toBe(true);
    expect(db.sessionInstance.findFirst).toHaveBeenCalledWith({
      where: {
        clientId: 'client-1',
        archivedAt: null,
        OR: [{ isIncomplete: true }, { isCompleted: true }, { status: 'COMPLETED' }],
      },
      select: { id: true },
    });
    db.sessionInstance.findFirst.mockResolvedValue({ id: 'closed' });
    expect((await service.get(context)).eligibleForAutoStart).toBe(false);
    expect(db.client.update).not.toHaveBeenCalled();
  });
  it('locks and updates only the authenticated profile with audit fields', async () => {
    const { db, service } = setup();
    const input = { version: 1, status: 'in_progress', step: 'save' };
    expect((await service.patch(context, input)).step).toBe('save');
    expect(db.$queryRaw).toHaveBeenCalled();
    expect(db.client.update).toHaveBeenCalledWith({
      where: { id: 'client-1' },
      data: { firstWorkoutGuide: input, updatedBy: 'uid' },
    });
    expect(db.client.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: context.email, archivedAt: null },
      }),
    );
  });
  it('rejects forged eligibility and does not regress terminal states', async () => {
    const { db, service } = setup();
    await expect(service.patch(context, { eligibleForAutoStart: true })).rejects.toThrow();
    db.client.findUniqueOrThrow.mockResolvedValue({
      id: 'client-1',
      archivedAt: null,
      firstWorkoutGuide: { version: 1, status: 'completed', step: 'help' },
    });
    expect((await service.patch(context, { version: 1, status: 'in_progress', step: 'save' })).status).toBe('completed');
  });
});
