import { ConflictException } from '@nestjs/common';
import {
  archiveClientAndReleaseSeat,
  claimClientSeat,
  claimTrainingPlanAssignment,
} from '../../src/modules/clients/infra/prisma/client.repository.prisma.ops';

describe('client concurrency', () => {
  it('does not occupy a seat when the conditional update changes no row', async () => {
    const tx = {
      $executeRaw: jest.fn(async () => 0),
      organizationSubscription: { findUnique: async () => ({ id: 'sub' }) },
    };

    await expect(claimClientSeat(tx as never, 'org')).rejects.toBeInstanceOf(ConflictException);
    await expect(claimClientSeat(tx as never, 'org')).rejects.toThrow('Client limit reached for organization');
    expect(tx.$executeRaw).toHaveBeenCalled();
  });

  it('does not release a seat when the client was already archived', async () => {
    const tx = {
      $executeRaw: jest.fn(async () => 1),
      client: { updateMany: async () => ({ count: 0 }) },
    };

    await archiveClientAndReleaseSeat(tx as never, 'client', 'org', { archivedAt: new Date() });

    expect(tx.$executeRaw).not.toHaveBeenCalled();
  });

  it('releases the seat only after the archive updates a row', async () => {
    const tx = {
      $executeRaw: jest.fn(async () => 1),
      client: { updateMany: async () => ({ count: 1 }) },
    };

    await archiveClientAndReleaseSeat(tx as never, 'client', 'org', { archivedAt: new Date() });

    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('rejects a training plan assignment that no longer matches the row', async () => {
    const tx = {
      client: {
        findFirst: async () => ({ trainingPlanId: 'plan-a' }),
        updateMany: async () => ({ count: 0 }),
      },
    };

    await expect(claimTrainingPlanAssignment(tx as never, 'client', 'plan-b')).rejects.toThrow(
      'Training plan assignment changed',
    );
  });
});
