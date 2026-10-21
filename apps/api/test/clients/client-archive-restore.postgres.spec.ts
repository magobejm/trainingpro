import { PrismaClient } from '@prisma/client';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import { ClientRepositoryPrisma } from '../../src/modules/clients/infra/prisma/client.repository.prisma';
import { sessionFixture } from '../sessions/session-transitions.fixture';

const url = process.env.TEST_SESSION_DATABASE_URL;
const postgres = url ? describe : describe.skip;
jest.setTimeout(20000);

postgres('archived clients against PostgreSQL', () => {
  let db: PrismaClient;
  let fixture: Awaited<ReturnType<typeof sessionFixture>>;
  let repo: ClientRepositoryPrisma;
  let clientUserId: string;

  beforeAll(async () => {
    const local = new URL(url!);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(local.hostname)) throw new Error('Requires a local test database');
    db = new PrismaClient({ datasources: { db: { url: local.toString() } } });
    fixture = await sessionFixture(db);
    repo = new ClientRepositoryPrisma(db as PrismaService);
    await db.user.update({ where: { id: fixture.user.id }, data: { email: `coach-${fixture.user.email}` } });
    const clientUser = await db.user.create({
      data: { email: fixture.client.email, supabaseUid: crypto.randomUUID() },
    });
    clientUserId = clientUser.id;
    await db.organizationMember.create({
      data: { organizationId: fixture.org.id, role: 'CLIENT', userId: clientUser.id },
    });
    await db.organizationSubscription.create({
      data: { organizationId: fixture.org.id, clientLimit: 1, activeClientCount: 1 },
    });
  });

  afterAll(async () => {
    try {
      if (fixture) {
        await db.organizationMember.deleteMany({ where: { organizationId: fixture.org.id, userId: clientUserId } });
        await db.user.deleteMany({ where: { id: clientUserId } });
        await fixture.cleanup();
      }
    } finally {
      await db?.$disconnect();
    }
  });

  it('lists only the coach’s archived clients and restores exactly one seat', async () => {
    const coach = {
      ...fixture.context,
      activeRole: 'coach' as const,
      roles: ['coach' as const],
      subject: fixture.user.supabaseUid,
    };
    await repo.archiveClient(coach, fixture.client.id);

    const archived = await repo.listArchivedClientsPage(coach, { limit: 10, search: 'Concurrency' });
    expect(archived.items).toHaveLength(1);
    expect(archived.items[0]).toMatchObject({ id: fixture.client.id, email: fixture.client.email });
    expect(archived.items[0]!.archivedAt).toBeInstanceOf(Date);

    const outcomes = await Promise.allSettled([
      repo.restoreClient(coach, fixture.client.id),
      repo.restoreClient(coach, fixture.client.id),
    ]);
    expect(outcomes.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(await db.client.findUniqueOrThrow({ where: { id: fixture.client.id }, select: { archivedAt: true } })).toEqual({
      archivedAt: null,
    });
    expect(
      await db.organizationSubscription.findUniqueOrThrow({
        where: { organizationId: fixture.org.id },
        select: { activeClientCount: true },
      }),
    ).toEqual({ activeClientCount: 1 });
    expect(
      await db.organizationMember.findFirstOrThrow({
        where: { organizationId: fixture.org.id, userId: clientUserId, role: 'CLIENT' },
        select: { isActive: true, archivedAt: true },
      }),
    ).toEqual({ isActive: true, archivedAt: null });
  });

  it('leaves a client archived when the organization has no available seat', async () => {
    const coach = {
      ...fixture.context,
      activeRole: 'coach' as const,
      roles: ['coach' as const],
      subject: fixture.user.supabaseUid,
    };
    await repo.archiveClient(coach, fixture.client.id);
    await db.organizationSubscription.update({ where: { organizationId: fixture.org.id }, data: { clientLimit: 0 } });

    await expect(repo.restoreClient(coach, fixture.client.id)).rejects.toThrow('Client limit reached');
    expect(
      await db.client.findUniqueOrThrow({ where: { id: fixture.client.id }, select: { archivedAt: true } }),
    ).toMatchObject({ archivedAt: expect.any(Date) });
    expect(
      await db.organizationSubscription.findUniqueOrThrow({
        where: { organizationId: fixture.org.id },
        select: { activeClientCount: true },
      }),
    ).toEqual({ activeClientCount: 0 });
  });
});
