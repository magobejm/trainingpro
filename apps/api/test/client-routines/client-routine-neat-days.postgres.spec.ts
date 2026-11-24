import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { sessionFixture } from '../sessions/session-transitions.fixture';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import { addClientDay, removeClientDay, renameClientDay } from '../../src/modules/client-routines/client-routine-days';
import { saveWeekNeats } from '../../src/modules/client-routines/client-routine-neats';
import {
  clientNeatTemplateIds,
  createClientRoutine,
  neatGoalDays,
  neatsForDate,
  resolveClientDay,
  syncClientRoutineWeeks,
} from '../../src/modules/plans/infra/prisma/client-routine.prisma';

const postgres = process.env.TEST_SESSION_DATABASE_URL ? describe : describe.skip;
const WEEK_ONE = '2026-12-14';
const WEEK_TWO = '2026-12-21';
const BEFORE_ALL = '2026-10-01';

// eslint-disable-next-line max-lines-per-function
postgres('client routine NEAT per week and own days', () => {
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
    await db.clientNeatLog.deleteMany({ where: { clientId } });
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

  const prisma = () => db as PrismaService;

  /** A routine with one library day, two NEAT goals, and two scheduled weeks that already have their own copy. */
  async function setup() {
    const day = await db.planDay.create({
      data: {
        templateId: fixture.template.id,
        dayIndex: 1,
        title: 'Day 1',
        exercises: { create: [{ displayName: 'Squat', repsMin: 8, sortOrder: 0 }] },
      },
    });
    await db.planTemplateNeat.createMany({
      data: [
        { sortOrder: 0, templateId: fixture.template.id, title: 'Steps' },
        { sortOrder: 1, templateId: fixture.template.id, title: 'Stairs' },
      ],
    });
    await db.$transaction((tx) =>
      createClientRoutine(tx, fixture.client.id, fixture.template.id, fixture.context.subject, '2026-10-05'),
    );
    for (const date of [WEEK_ONE, WEEK_TWO]) {
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
    await syncClientRoutineWeeks(prisma(), fixture.client.id, fixture.context.subject);
    const routine = await db.clientRoutine.findFirstOrThrow({
      include: { weeks: { orderBy: { weekIndex: 'asc' } } },
      where: { archivedAt: null, clientId: fixture.client.id },
    });
    return { day, routine };
  }

  const titles = (templateId: string) =>
    db.planTemplateNeat
      .findMany({ orderBy: { sortOrder: 'asc' }, where: { archivedAt: null, templateId } })
      .then((rows) => rows.map((row) => row.title));

  it('edits the chosen week in place and carries the change to later weeks and the base copy', async () => {
    const { routine } = await setup();
    const [first, second] = routine.weeks as [(typeof routine.weeks)[number], (typeof routine.weeks)[number]];
    expect(await titles(first.templateId)).toEqual(['Steps', 'Stairs']);
    const steps = await db.planTemplateNeat.findFirstOrThrow({ where: { templateId: first.templateId, title: 'Steps' } });
    await db.clientNeatLog.create({
      data: { clientId: fixture.client.id, date: new Date(WEEK_ONE), done: true, neatId: steps.id },
    });

    await saveWeekNeats(prisma(), routine, first, BEFORE_ALL, [
      { id: steps.id, title: 'Walk 12.000 steps' },
      { title: 'Stretch every hour', description: 'Two minutes' },
    ]);

    expect(await titles(first.templateId)).toEqual(['Walk 12.000 steps', 'Stretch every hour']);
    expect(await titles(second.templateId)).toEqual(['Walk 12.000 steps', 'Stretch every hour']);
    expect(await titles(routine.baseTemplateId)).toEqual(['Walk 12.000 steps', 'Stretch every hour']);
    expect(await titles(fixture.template.id)).toEqual(['Steps', 'Stairs']);
    const kept = await db.planTemplateNeat.findUniqueOrThrow({ where: { id: steps.id } });
    expect(kept.title).toBe('Walk 12.000 steps');
    expect(await db.clientNeatLog.count({ where: { neatId: steps.id, done: true } })).toBe(1);
    const archived = await db.planTemplateNeat.count({ where: { archivedAt: { not: null }, templateId: first.templateId } });
    expect(archived).toBe(1);
  });

  it('does not touch the weeks before the chosen one and refuses closed weeks', async () => {
    const { routine } = await setup();
    const [first, second] = routine.weeks as [(typeof routine.weeks)[number], (typeof routine.weeks)[number]];
    await saveWeekNeats(prisma(), routine, second, BEFORE_ALL, [{ title: 'Only later' }]);
    expect(await titles(second.templateId)).toEqual(['Only later']);
    expect(await titles(first.templateId)).toEqual(['Steps', 'Stairs']);
    await expect(saveWeekNeats(prisma(), routine, first, '2027-02-01', [{ title: 'Late' }])).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('reads the NEAT of a date from its week, then the base copy, and counts goals per day', async () => {
    const { routine } = await setup();
    const [first] = routine.weeks as [(typeof routine.weeks)[number]];
    await saveWeekNeats(prisma(), routine, first, BEFORE_ALL, [{ title: 'Walk' }]);
    const second = routine.weeks[1]!;
    await db.planTemplateNeat.createMany({
      data: [
        { sortOrder: 1, templateId: second.templateId, title: 'Extra A' },
        { sortOrder: 2, templateId: second.templateId, title: 'Extra B' },
      ],
    });
    const inWeek = await neatsForDate(prisma(), fixture.client.id, WEEK_ONE);
    expect(inWeek?.map((item) => item.title)).toEqual(['Walk']);
    const inSecond = await neatsForDate(prisma(), fixture.client.id, WEEK_TWO);
    expect(inSecond).toHaveLength(3);
    const outside = await neatsForDate(prisma(), fixture.client.id, '2026-11-02');
    expect(outside?.map((item) => item.title)).toEqual(['Walk']);
    // 7 days with 1 goal + 7 days with 3 goals.
    expect(await neatGoalDays(prisma(), fixture.client.id, WEEK_ONE, '2026-12-27')).toBe(7 + 21);
    const ids = await clientNeatTemplateIds(prisma(), fixture.client.id);
    expect(ids).toEqual(expect.arrayContaining([routine.baseTemplateId, first.templateId, second.templateId]));
  });

  it('returns null without a routine copy so the caller falls back to the library', async () => {
    expect(await neatsForDate(prisma(), fixture.client.id, WEEK_ONE)).toBeNull();
    expect(await neatGoalDays(prisma(), fixture.client.id, WEEK_ONE, WEEK_TWO)).toBeNull();
  });

  it('adds an own day to the base copy and the open weeks with a free index', async () => {
    const { routine } = await setup();
    const index = await addClientDay(prisma(), routine, BEFORE_ALL, 'Movilidad');
    expect(index).toBe(2);
    for (const templateId of [routine.baseTemplateId, ...routine.weeks.map((week) => week.templateId)]) {
      const copy = await db.planDay.findFirstOrThrow({ where: { dayIndex: index, templateId } });
      expect(copy.title).toBe('Movilidad');
    }
    expect(await db.planDay.count({ where: { dayIndex: index, templateId: fixture.template.id } })).toBe(0);
    const base = await db.planDay.findFirstOrThrow({ where: { dayIndex: index, templateId: routine.baseTemplateId } });
    const week = await db.$transaction((tx) =>
      resolveClientDay(tx, fixture.client.id, fixture.template.id, base.id, WEEK_ONE),
    );
    expect(week?.templateId).toBe(routine.weeks[0]!.templateId);
  });

  it('renames and deletes an own day, but never a library day, and blocks a scheduled one', async () => {
    const { day, routine } = await setup();
    await addClientDay(prisma(), routine, BEFORE_ALL, 'Movilidad');
    const base = await db.planDay.findFirstOrThrow({ where: { dayIndex: 2, templateId: routine.baseTemplateId } });
    await renameClientDay(prisma(), routine, BEFORE_ALL, base.id, 'Core');
    expect(await db.planDay.count({ where: { dayIndex: 2, title: 'Core' } })).toBe(3);
    const libraryCopy = await db.planDay.findFirstOrThrow({ where: { dayIndex: 1, templateId: routine.baseTemplateId } });
    await expect(renameClientDay(prisma(), routine, BEFORE_ALL, libraryCopy.id, 'X')).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(removeClientDay(prisma(), routine, BEFORE_ALL, libraryCopy.id)).rejects.toBeInstanceOf(ConflictException);

    await db.calendarEvent.create({
      data: {
        clientId: fixture.client.id,
        coachMembershipId: fixture.member.id,
        date: new Date(WEEK_ONE),
        type: 'workout',
        planDayId: base.id,
      },
    });
    await expect(removeClientDay(prisma(), routine, BEFORE_ALL, base.id)).rejects.toBeInstanceOf(ConflictException);
    await db.calendarEvent.deleteMany({ where: { planDayId: base.id } });
    await removeClientDay(prisma(), routine, BEFORE_ALL, base.id);
    expect(await db.planDay.count({ where: { archivedAt: null, dayIndex: 2, templateId: routine.baseTemplateId } })).toBe(0);
    expect(day.dayIndex).toBe(1);
  });
});
