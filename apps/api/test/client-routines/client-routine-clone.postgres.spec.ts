import { PrismaClient } from '@prisma/client';
import { sessionFixture } from '../sessions/session-transitions.fixture';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import { applyProgression } from '../../src/modules/client-routines/client-routine-progression';
import { setDayWarmups, setExerciseGroup } from '../../src/modules/client-routines/client-routine-groups';
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
        exercises: {
          create: [
            { displayName: 'Squat', repsMin: 8, sortOrder: 0 },
            { displayName: 'Row', repsMin: 8, sortOrder: 1 },
          ],
        },
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

  it('groups two exercises of a future week into a superset and ungroups them', async () => {
    const { day, routine } = await setup();
    await db.calendarEvent.create({
      data: {
        clientId: fixture.client.id,
        coachMembershipId: fixture.member.id,
        date: new Date('2026-12-14'),
        type: 'workout',
        planDayId: day.id,
      },
    });
    const prisma = db as PrismaService;
    await syncClientRoutineWeeks(prisma, fixture.client.id, fixture.context.subject);
    const full = await db.clientRoutine.findUniqueOrThrow({ where: { id: routine.id }, include: { weeks: true } });
    const week = full.weeks[0]!;
    const copy = await db.planStrengthExercise.findMany({
      where: { day: { templateId: week.templateId, dayIndex: 1 } },
    });
    const ids = copy.map((item) => item.id);
    await setExerciseGroup(prisma, full, week, 1, { exerciseIds: ids, groupType: 'SUPERSET' });
    const grouped = await db.planStrengthExercise.findMany({ where: { id: { in: ids } } });
    expect(new Set(grouped.map((item) => item.groupId)).size).toBe(1);
    expect(grouped[0]!.groupId).not.toBeNull();
    await setExerciseGroup(prisma, full, week, 1, { exerciseIds: ids, groupType: null });
    const free = await db.planStrengthExercise.findMany({ where: { id: { in: ids } } });
    expect(free.every((item) => item.groupId === null)).toBe(true);
  });

  it('replaces the warm-ups of a future day', async () => {
    const { day, routine } = await setup();
    await db.calendarEvent.create({
      data: {
        clientId: fixture.client.id,
        coachMembershipId: fixture.member.id,
        date: new Date('2026-12-14'),
        type: 'workout',
        planDayId: day.id,
      },
    });
    const prisma = db as PrismaService;
    await syncClientRoutineWeeks(prisma, fixture.client.id, fixture.context.subject);
    const full = await db.clientRoutine.findUniqueOrThrow({ where: { id: routine.id }, include: { weeks: true } });
    const week = full.weeks[0]!;
    const warmup = await db.warmupTemplate.create({
      data: { name: 'QA warm-up', organizationId: fixture.client.organizationId, scope: 'COACH' },
    });
    try {
      await setDayWarmups(prisma, full, week, 1, [warmup.id]);
      const copyDay = await db.planDay.findFirstOrThrow({
        where: { dayIndex: 1, templateId: week.templateId },
        include: { warmups: true },
      });
      expect(copyDay.warmups.map((item) => item.warmupTemplateId)).toEqual([warmup.id]);
      await setDayWarmups(prisma, full, week, 1, []);
      expect(await db.planDayWarmup.count({ where: { planDayId: copyDay.id } })).toBe(0);
    } finally {
      await db.planDayWarmup.deleteMany({ where: { warmupTemplateId: warmup.id } });
      await db.warmupTemplate.delete({ where: { id: warmup.id } });
    }
  });

  it('applies duration and distance rules to the cardio sets of a future week', async () => {
    const { day, routine } = await setup();
    await db.planCardioBlock.create({
      data: {
        dayId: day.id,
        displayName: 'Run',
        workSeconds: 600,
        sets: { create: { setIndex: 0, durationSeconds: 600, distanceMeters: 2000 } },
      },
    });
    const copy = await db.clientRoutine.findUniqueOrThrow({ where: { id: routine.id } });
    await db.planCardioBlock.create({
      data: {
        dayId: (await db.planDay.findFirstOrThrow({ where: { dayIndex: 1, templateId: copy.baseTemplateId } })).id,
        displayName: 'Run',
        workSeconds: 600,
        sets: { create: { setIndex: 0, durationSeconds: 600, distanceMeters: 2000 } },
      },
    });
    await db.calendarEvent.create({
      data: {
        clientId: fixture.client.id,
        coachMembershipId: fixture.member.id,
        date: new Date('2026-12-14'),
        type: 'workout',
        planDayId: day.id,
      },
    });
    const prisma = db as PrismaService;
    await syncClientRoutineWeeks(prisma, fixture.client.id, fixture.context.subject);
    const full = await db.clientRoutine.findUniqueOrThrow({ where: { id: routine.id }, include: { weeks: true } });
    const week = full.weeks[0]!;
    const result = await applyProgression(prisma, full, {
      cascade: false,
      dayIndexes: [],
      rules: [
        { mode: 'delta', value: 120, variable: 'durationSeconds' },
        { mode: 'percent', value: 10, variable: 'distanceMeters' },
      ],
      weekIds: [week.id],
    });
    expect(result.changedSets).toBeGreaterThanOrEqual(1);
    const set = await db.planCardioSet.findFirstOrThrow({
      where: { block: { day: { dayIndex: 1, templateId: week.templateId } } },
    });
    expect(set.durationSeconds).toBe(720);
    expect(set.distanceMeters).toBe(2200);
  });
});
