import { ConflictException } from '@nestjs/common';
import {
  archiveClientAndReleaseSeat,
  claimClientSeat,
  claimTrainingPlanAssignment,
  restoreArchivedClient,
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

  it('claims one seat only after it atomically restores an owned archived client', async () => {
    const tx = {
      $executeRaw: jest.fn(async () => 1),
      client: { updateMany: jest.fn(async () => ({ count: 1 })) },
      organizationSubscription: { findUnique: async () => ({ id: 'sub' }) },
      user: { updateMany: jest.fn(async () => ({ count: 1 })) },
      organizationMember: { updateMany: jest.fn(async () => ({ count: 1 })) },
    };

    await restoreArchivedClient(tx as never, 'client', 'coach', 'org', 'subject', 'client@example.test');

    expect(tx.client.updateMany).toHaveBeenCalledWith({
      where: { archivedAt: { not: null }, coachMembershipId: 'coach', id: 'client', organizationId: 'org' },
      data: { archivedAt: null, archivedBy: null, updatedBy: 'subject' },
    });
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.user.updateMany).toHaveBeenCalledWith({ where: { email: 'client@example.test' }, data: { isActive: true } });
    expect(tx.organizationMember.updateMany).toHaveBeenCalledWith({
      where: { organizationId: 'org', role: 'CLIENT', user: { email: 'client@example.test' } },
      data: { archivedAt: null, isActive: true },
    });
  });

  it('does not claim a seat if another request already restored the client', async () => {
    const tx = {
      $executeRaw: jest.fn(async () => 1),
      client: { updateMany: jest.fn(async () => ({ count: 0 })) },
      organizationSubscription: { findUnique: async () => ({ id: 'sub' }) },
    };

    await expect(
      restoreArchivedClient(tx as never, 'client', 'coach', 'org', 'subject', 'client@example.test'),
    ).rejects.toThrow('Archived client not found');
    expect(tx.$executeRaw).not.toHaveBeenCalled();
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
