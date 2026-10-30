import { ForbiddenException } from '@nestjs/common';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import { ClientNotesService } from '../../src/modules/client-notes/client-notes.service';

const context = (activeRole: 'client' | 'coach'): AuthContext =>
  ({ activeRole, email: 'client@example.com', subject: 'uid-1' }) as unknown as AuthContext;

function build() {
  const create = jest.fn().mockResolvedValue({ id: 'note-1' });
  const prisma = {
    client: {
      findFirst: jest.fn().mockResolvedValue({ coachMembershipId: 'coach-1', id: 'client-1', organizationId: 'org-1' }),
    },
    clientNote: { create, findMany: jest.fn().mockResolvedValue([]) },
    organizationMember: { findFirst: jest.fn().mockResolvedValue({ id: 'coach-1' }) },
  };
  return { create, prisma, service: new ClientNotesService(prisma as unknown as PrismaService) };
}

describe('ClientNotesService', () => {
  it('stores the note under the coach of the client, with the chosen category', async () => {
    const { create, service } = build();
    await service.create(context('client'), { category: 'EXERCISE', exerciseName: 'Sentadilla', text: 'Me pesó' });
    expect(create.mock.calls[0]![0].data).toMatchObject({
      category: 'EXERCISE',
      clientId: 'client-1',
      coachMembershipId: 'coach-1',
      organizationId: 'org-1',
      text: 'Me pesó',
    });
  });

  it('does not let a coach write notes', async () => {
    const { service } = build();
    await expect(service.create(context('coach'), { category: 'OTHER', text: 'x' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('does not let a client read notes and only lists the coach own clients', async () => {
    const { prisma, service } = build();
    await expect(service.list(context('client'), { clientId: 'client-1' })).rejects.toBeInstanceOf(ForbiddenException);
    await service.list(context('coach'), { category: 'EXERCISE', clientId: 'client-1' });
    expect(prisma.clientNote.findMany.mock.calls[0]![0].where).toMatchObject({
      category: 'EXERCISE',
      client: { archivedAt: null, coachMembershipId: 'coach-1' },
    });
  });
});
