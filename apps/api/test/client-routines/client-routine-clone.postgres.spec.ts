import { PrismaClient } from '@prisma/client';
import { sessionFixture } from '../sessions/session-transitions.fixture';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import {
  createClientRoutine,
  resolveClientDay,
  syncClientRoutineWeeks,
} from '../../src/modules/plans/infra/prisma/client-routine.prisma';

const postgres = process.env.TEST_SESSION_DATABASE_URL ? describe : describe.skip;

// eslint-disable-next-line max-lines-per-function
postgres('client routine copy and weeks', () => {
  let db: PrismaClient;
  let fixture: Awaited<ReturnType<typeof sessionFixture>>;
  beforeAll(() => {
    const url = new URL(process.env.TEST_SESSION_DATABASE_URL!);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Requires local PostgreSQL');
    url.searchParams.set('connection_limit', '1');
    db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  });
  beforeEach(async () => {
    fixture = await sessionFixture(db);
  });
  afterEach(async () => {
    if (!fixture) return;
    const clientId = fixture.client.id;
    await db.calendarEvent.deleteMany({ where: { clientId } });
    const routines = await db.clientRoutine.findMany({ where: { clientId }, include: { weeks: true } });
    await db.clientRoutineWeek.deleteMany({ where: { clientRoutine: { clientId } } });
    await db.clientRoutine.deleteMany({ where: { clientId } });
    const copyIds = routines.flatMap((r) => [r.baseTemplateId, ...r.weeks.map((w) => w.templateId)]);
    await db.planTemplate.deleteMany({ where: { id: { in: copyIds } } });
    await fixture.cleanup();
  });
  afterAll(async () => {
    await db?.$disconnect();
  });

  async function setup() {
    const day = await db.planDay.create({
      data: {
        templateId: fixture.template.id,
        dayIndex: 1,
        title: 'Day 1',
        exercises: { create: { displayName: 'Squat', repsMin: 8 } },
      },
    });
    const routine = await db.$transaction((tx) =>
      createClientRoutine(tx, fixture.client.id, fixture.template.id, fixture.context.subject, '2026-10-05'),
    );
    return { day, routine: routine! };
  }

  it('clones the template into a client-owned copy without touching the library', async () => {
    const { routine } = await setup();
    expect(routine.baseTemplateId).not.toBe(fixture.template.id);
    const copy = await db.planTemplate.findUniqueOrThrow({
      where: { id: routine.baseTemplateId },
      include: { days: { include: { exercises: true } } },
    });
    expect(copy.ownerClientId).toBe(fixture.client.id);
    expect(copy.days[0]?.exercises[0]?.displayName).toBe('Squat');
    const source = await db.planTemplate.findUniqueOrThrow({ where: { id: fixture.template.id } });
    expect(source.ownerClientId).toBeNull();
  });

  it('archives the previous copy when the routine is assigned again', async () => {
    const { routine } = await setup();
    const next = await db.$transaction((tx) =>
      createClientRoutine(tx, fixture.client.id, fixture.template.id, fixture.context.subject),
    );
    const old = await db.clientRoutine.findUniqueOrThrow({ where: { id: routine.id } });
    expect(old.archivedAt).not.toBeNull();
    expect(next!.archivedAt).toBeNull();
  });

  it('creates one week per planned microcycle and does not duplicate it on a second sync', async () => {
    const { day } = await setup();
    for (const date of ['2026-10-05', '2026-10-06', '2026-10-13']) {
      await db.calendarEvent.create({
        data: {
          clientId: fixture.client.id,
          coachMembershipId: fixture.member.id,
          date: new Date(date),
          type: 'workout',
          planDayId: day.id,
        },
      });
    }
    const prisma = db as PrismaService;
    await syncClientRoutineWeeks(prisma, fixture.client.id, fixture.context.subject);
    await syncClientRoutineWeeks(prisma, fixture.client.id, fixture.context.subject);
    const weeks = await db.clientRoutineWeek.findMany({
      where: { clientRoutine: { clientId: fixture.client.id } },
      orderBy: { weekIndex: 'asc' },
    });
    expect(weeks.map((w) => w.weekIndex)).toEqual([1, 2]);
    expect(new Set(weeks.map((w) => w.templateId)).size).toBe(2);
  });

  it('resolves the day of the matching week and falls back to the base copy', async () => {
    const { day, routine } = await setup();
    await db.calendarEvent.create({
      data: {
        clientId: fixture.client.id,
        coachMembershipId: fixture.member.id,
        date: new Date('2026-10-05'),
        type: 'workout',
        planDayId: day.id,
      },
    });
    await syncClientRoutineWeeks(db as PrismaService, fixture.client.id, fixture.context.subject);
    const week = await db.clientRoutineWeek.findFirstOrThrow({ where: { clientRoutineId: routine.id } });
    const inWeek = await db.$transaction((tx) =>
      resolveClientDay(tx, fixture.client.id, fixture.template.id, day.id, '2026-10-06'),
    );
    expect(inWeek?.templateId).toBe(week.templateId);
    const later = await db.$transaction((tx) =>
      resolveClientDay(tx, fixture.client.id, fixture.template.id, day.id, '2026-11-20'),
    );
    expect(later?.templateId).toBe(routine.baseTemplateId);
  });
});
