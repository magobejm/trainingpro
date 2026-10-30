import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import type { RoutineHandoffPreview } from '@trainerpro/shared';
import { ClearFutureWorkoutsUseCase } from '../../src/modules/calendar/application/use-cases/clear-future-workouts.usecase';
import { ClientRepositoryPrisma } from '../../src/modules/clients/infra/prisma/client.repository.prisma';
import { SessionsRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions.repository.prisma';
import { SessionsCardioRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions-cardio.repository.prisma';
import { sessionFixture, gate } from '../sessions/session-transitions.fixture';

const url = process.env.TEST_SESSION_DATABASE_URL;
const postgres = url ? describe : describe.skip;
const from = '2026-10-16';
jest.setTimeout(30000);
// eslint-disable-next-line max-lines-per-function
postgres('routine handoff against PostgreSQL', () => {
  let db: PrismaClient;
  let fixture: Awaited<ReturnType<typeof sessionFixture>>;
  let nextId: string;
  const coach = () => ({ ...fixture.context, activeRole: 'coach' as const, roles: ['coach' as const] });
  const repository = (client = db) => new ClientRepositoryPrisma(client as PrismaService);
  const preview = () =>
    new ClearFutureWorkoutsUseCase(db as PrismaService).execute(coach(), {
      clientId: fixture.client.id,
      from,
      dryRun: true,
    }) as Promise<RoutineHandoffPreview>;
  const apply = (snapshot: RoutineHandoffPreview, mode: 'replace' | 'continue' = 'replace', client = db) =>
    repository(client).updateClient(coach(), fixture.client.id, {
      trainingPlanId: nextId,
      routineHandoff: { mode, from, expectedSignature: snapshot.signature },
    });
  const event = (planDayId: string | null = null, date = from, type = 'workout') =>
    db.calendarEvent.create({
      data: {
        clientId: fixture.client.id,
        coachMembershipId: fixture.member.id,
        date: new Date(date),
        type,
        planDayId,
        title: 'TP-43',
      },
    });
  beforeAll(async () => {
    const local = new URL(url!);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(local.hostname)) throw new Error('Requires a local test database');
    local.searchParams.set('connection_limit', '5');
    db = new PrismaClient({ datasources: { db: { url: local.toString() } } });
    fixture = await sessionFixture(db);
    const next = await db.planTemplate.create({
      data: { name: 'TP-43 new', coachMembershipId: fixture.member.id, organizationId: fixture.org.id },
    });
    nextId = next.id;
  });
  beforeEach(async () => {
    await db.calendarEvent.deleteMany({ where: { clientId: fixture.client.id } });
    await db.sessionInstance.deleteMany({ where: { clientId: fixture.client.id } });
    await db.client.update({ where: { id: fixture.client.id }, data: { trainingPlanId: fixture.template.id } });
  });
  afterAll(async () => {
    try {
      if (fixture) {
        await db.calendarEvent.deleteMany({ where: { clientId: fixture.client.id } });
        await db.client.update({ where: { id: fixture.client.id }, data: { trainingPlanId: null } });
        await db.client.update({ where: { id: fixture.client.id }, data: { activeRoutineAssignmentId: null } });
        await db.routineAssignment.deleteMany({ where: { clientId: fixture.client.id } });
        await db.clientRoutine.deleteMany({ where: { clientId: fixture.client.id } });
        if (nextId) await db.routineRevision.deleteMany({ where: { templateId: nextId } });
        if (nextId) await db.planTemplate.delete({ where: { id: nextId } });
        await fixture.cleanup();
      }
    } finally {
      await db?.$disconnect();
    }
  });

  it('previews the entire future without writes and applies exactly that snapshot atomically', async () => {
    const pending = await event(null, '2035-01-01');
    const past = await event(null, '2026-10-15');
    const note = await event(null, from, 'note');
    const before = await preview();
    expect(before.removable.map((row) => row.id)).toEqual([pending.id]);
    expect(await db.calendarEvent.count({ where: { clientId: fixture.client.id, archivedAt: { not: null } } })).toBe(0);
    expect((await db.client.findUniqueOrThrow({ where: { id: fixture.client.id } })).trainingPlanId).toBe(
      fixture.template.id,
    );
    await apply(before);
    expect((await db.client.findUniqueOrThrow({ where: { id: fixture.client.id } })).trainingPlanId).toBe(nextId);
    expect((await db.calendarEvent.findUniqueOrThrow({ where: { id: pending.id } })).archivedAt).not.toBeNull();
    for (const id of [past.id, note.id])
      expect((await db.calendarEvent.findUniqueOrThrow({ where: { id } })).archivedAt).toBeNull();
  });
  it('continues without deleting events, including an empty calendar', async () => {
    await apply(await preview(), 'continue');
    await event();
    await apply(await preview(), 'continue');
    expect(await db.calendarEvent.count({ where: { clientId: fixture.client.id, archivedAt: null } })).toBe(1);
  });
  it('protects only the started/completed day of a routine on a shared calendar date', async () => {
    const days = await Promise.all(
      [0, 1].map((dayIndex) => db.planDay.create({ data: { templateId: fixture.template.id, dayIndex, title: 'Day' } })),
    );
    try {
      const protectedEvent = await event(days[0]!.id);
      const pending = await event(days[1]!.id);
      const row = await fixture.create(new Date());
      await db.sessionInstance.update({ where: { id: row.id }, data: { planDayId: days[0]!.id } });
      const snapshot = await preview();
      expect(snapshot.preserved.map((item) => item.id)).toEqual([protectedEvent.id]);
      expect(snapshot.removable.map((item) => item.id)).toEqual([pending.id]);
      await apply(snapshot);
      expect((await db.calendarEvent.findUniqueOrThrow({ where: { id: protectedEvent.id } })).archivedAt).toBeNull();
    } finally {
      await db.calendarEvent.deleteMany({ where: { clientId: fixture.client.id } });
      await db.sessionInstance.deleteMany({ where: { clientId: fixture.client.id } });
      await db.planDay.deleteMany({ where: { templateId: fixture.template.id } });
    }
  });
  it.each(['start', 'finish', 'skip', 'event', 'assignment'])(
    'rejects changes to %s without partial assignment or removal',
    async (change) => {
      const planned = await event();
      const session = await fixture.create();
      const snapshot = await preview();
      if (change === 'start')
        await db.sessionInstance.update({
          where: { id: session.id },
          data: { startedAt: new Date(), status: 'IN_PROGRESS' },
        });
      if (change === 'finish')
        await db.sessionInstance.update({ where: { id: session.id }, data: { status: 'COMPLETED', isIncomplete: true } });
      if (change === 'skip')
        await db.sessionInstance.update({
          where: { id: session.id },
          data: { skippedAt: new Date(), skipReason: 'Changed' },
        });
      if (change === 'event') await db.calendarEvent.update({ where: { id: planned.id }, data: { title: 'Changed' } });
      if (change === 'assignment')
        await db.client.update({ where: { id: fixture.client.id }, data: { trainingPlanId: null } });
      await expect(apply(snapshot)).rejects.toBeInstanceOf(ConflictException);
      expect((await db.client.findUniqueOrThrow({ where: { id: fixture.client.id } })).trainingPlanId).toBe(
        change === 'assignment' ? null : fixture.template.id,
      );
      expect((await db.calendarEvent.findUniqueOrThrow({ where: { id: planned.id } })).archivedAt).toBeNull();
    },
  );
  it('serializes behind a concurrent session start and requires a fresh preview', async () => {
    await event();
    const row = await fixture.create();
    const snapshot = await preview();
    const locked = gate(),
      release = gate();
    const extended = db.$extends({
      query: {
        sessionInstance: {
          async updateMany({ args, query }) {
            if (args.where?.id === row.id) {
              locked.resolve();
              await release.promise;
            }
            return query(args);
          },
        },
      },
    });
    const cardio = new SessionsCardioRepositoryPrisma(extended as unknown as PrismaService);
    const starting = new SessionsRepositoryPrisma(extended as unknown as PrismaService, cardio).startSession(
      fixture.context,
      { sessionId: row.id },
    );
    await locked.promise;
    const confirming = apply(snapshot);
    const rejected = expect(confirming).rejects.toBeInstanceOf(ConflictException);
    release.resolve();
    await Promise.all([starting, rejected]);
    expect((await preview()).preserved).toHaveLength(1);
    expect((await db.client.findUniqueOrThrow({ where: { id: fixture.client.id } })).trainingPlanId).toBe(
      fixture.template.id,
    );
  });
  it('detects a newly created session after the initial client read', async () => {
    await event();
    const snapshot = await preview();
    const reading = gate(),
      release = gate();
    let intercepted = false;
    const extended = db.$extends({
      query: {
        client: {
          async findFirst({ args, query }) {
            const result = await query(args);
            if (!intercepted && args.where?.id === fixture.client.id) {
              intercepted = true;
              reading.resolve();
              await release.promise;
            }
            return result;
          },
        },
      },
    });
    const confirming = apply(snapshot, 'replace', extended as unknown as PrismaClient);
    const rejected = expect(confirming).rejects.toBeInstanceOf(ConflictException);
    await reading.promise;
    try {
      await fixture.create(new Date());
    } finally {
      release.resolve();
    }
    await rejected;
    expect((await preview()).preserved).toHaveLength(1);
  });
  it('rolls back event removal if assignment fails', async () => {
    const planned = await event();
    const snapshot = await preview();
    const failing = db.$extends({
      query: {
        client: {
          async update() {
            throw new Error('Assignment failed');
          },
        },
      },
    });
    await expect(apply(snapshot, 'replace', failing as unknown as PrismaClient)).rejects.toThrow('Assignment failed');
    expect((await db.calendarEvent.findUniqueOrThrow({ where: { id: planned.id } })).archivedAt).toBeNull();
    expect((await db.client.findUniqueOrThrow({ where: { id: fixture.client.id } })).trainingPlanId).toBe(
      fixture.template.id,
    );
  });
  it('denies another coach access to the preview', async () => {
    await expect(
      new ClearFutureWorkoutsUseCase(db as PrismaService).execute(
        { ...coach(), subject: '00000000-0000-4000-8000-000000000001' },
        {
          clientId: fixture.client.id,
          from,
          dryRun: true,
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
