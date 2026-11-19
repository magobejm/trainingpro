import { PrismaClient } from '@prisma/client';
import { sessionFixture } from '../sessions/session-transitions.fixture';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import { setExerciseGroup } from '../../src/modules/client-routines/client-routine-groups';
import {
  addWarmupItem,
  addWarmupSet,
  patchWarmupSet,
  removeWarmupItem,
  swapWarmupItem,
} from '../../src/modules/client-routines/client-routine-warmups';
import { buildWeek } from '../../src/modules/client-routines/client-routine-view';
import {
  mapSessionWithGroups,
  sessionInclude,
} from '../../src/modules/sessions/infra/prisma/sessions-strength.prisma.helpers';
import {
  createClientRoutine,
  syncClientRoutineWeeks,
  todayKey,
} from '../../src/modules/plans/infra/prisma/client-routine.prisma';

const postgres = process.env.TEST_SESSION_DATABASE_URL ? describe : describe.skip;

// eslint-disable-next-line max-lines-per-function
postgres('client routine warm-up copy', () => {
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
    await db.warmupTemplate.deleteMany({ where: { OR: [{ ownerClientId: clientId }, { name: 'QA library warm-up' }] } });
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
    const library = await db.warmupTemplate.create({
      data: {
        name: 'QA library warm-up',
        organizationId: fixture.client.organizationId,
        scope: 'COACH',
        items: {
          create: [
            {
              blockType: 'strength',
              displayName: 'Band pull',
              metadataJson: {
                sets: [
                  { setIndex: 0, reps: 10 },
                  { setIndex: 1, reps: 10 },
                ],
                setVariablesVersion: 2,
              },
              setsPlanned: 2,
              sortOrder: 0,
            },
            { blockType: 'strength', displayName: 'Cat cow', setsPlanned: 1, sortOrder: 1 },
          ],
        },
      },
      include: { items: true },
    });
    const day = await db.planDay.create({
      data: {
        templateId: fixture.template.id,
        dayIndex: 1,
        title: 'Day 1',
        exercises: { create: [{ displayName: 'Squat', repsMin: 8, sortOrder: 0 }] },
        warmups: { create: [{ warmupTemplateId: library.id }] },
      },
    });
    const created = await db.$transaction((tx) =>
      createClientRoutine(tx, fixture.client.id, fixture.template.id, fixture.context.subject, '2026-12-07'),
    );
    for (const date of ['2026-12-14', '2026-12-21']) {
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
    const routine = await db.clientRoutine.findUniqueOrThrow({
      where: { id: created!.id },
      include: { weeks: { orderBy: { weekIndex: 'asc' } } },
    });
    return { library, prisma, routine };
  }

  async function scopeOf(prisma: PrismaService, routine: Awaited<ReturnType<typeof setup>>['routine'], weekIndex: number) {
    const week = routine.weeks[weekIndex]!;
    const view = await buildWeek(prisma, routine, week, todayKey());
    const day = view.days.find((item) => item.dayIndex === 1)!;
    return { day, routine, warmupId: day.warmups[0]!.id, week };
  }

  it('edits a copy owned by the client and leaves the library warm-up untouched', async () => {
    const { library, prisma, routine } = await setup();
    const scope = await scopeOf(prisma, routine, 0);
    const [first, second] = scope.day.warmups[0]!.items;
    expect(first!.sets.map((set) => set.reps)).toEqual([10, 10]);

    await patchWarmupSet(scope, prisma, first!.id, first!.sets[1]!.id, { reps: 15 });
    const copied = await scopeOf(prisma, routine, 0);
    const cat = copied.day.warmups[0]!.items.find((item) => item.displayName === second!.displayName)!;
    await addWarmupSet(copied, prisma, cat.id);
    await swapWarmupItem(await scopeOf(prisma, routine, 0), prisma, cat.id, {
      displayName: 'Cat cow v2',
      libraryId: crypto.randomUUID(),
    }).catch((error: unknown) => expect(String(error)).toMatch(/oreign key/));

    const after = await db.warmupTemplate.findUniqueOrThrow({ where: { id: library.id }, include: { items: true } });
    expect(after.items.map((item) => item.displayName).sort()).toEqual(['Band pull', 'Cat cow']);
    expect(after.items.find((item) => item.displayName === 'Band pull')!.metadataJson).toEqual(
      library.items.find((item) => item.displayName === 'Band pull')!.metadataJson,
    );

    const mine = await scopeOf(prisma, routine, 0);
    const reference = await db.planDayWarmup.findUniqueOrThrow({
      where: { id: mine.warmupId },
      include: { warmupTemplate: true },
    });
    expect(reference.warmupTemplateId).not.toBe(library.id);
    expect(reference.warmupTemplate.ownerClientId).toBe(fixture.client.id);
    expect(reference.warmupTemplate.isRevision).toBe(true);
    const edited = mine.day.warmups[0]!.items.find((item) => item.displayName === 'Band pull')!;
    expect(edited.sets.map((set) => set.reps)).toEqual([10, 15]);
    expect(mine.day.warmups[0]!.items.find((item) => item.displayName === 'Cat cow')!.sets).toHaveLength(2);
  });

  it('keeps editing the same copy and carries removals and additions to later weeks', async () => {
    const { library, prisma, routine } = await setup();
    const scope = await scopeOf(prisma, routine, 0);
    const [first] = scope.day.warmups[0]!.items;
    await removeWarmupItem(scope, prisma, first!.id);
    const again = await scopeOf(prisma, routine, 0);
    expect(again.day.warmups[0]!.items.map((item) => item.displayName)).toEqual(['Cat cow']);
    const copies = await db.warmupTemplate.count({ where: { ownerClientId: fixture.client.id } });

    const method = await db.mobilityExercise.findFirst({ select: { id: true } });
    if (method) await addWarmupItem(again, prisma, { displayName: 'Extra', kind: 'mobility', libraryId: method.id });
    expect(await db.warmupTemplate.count({ where: { ownerClientId: fixture.client.id } })).toBe(copies);

    const later = await scopeOf(prisma, routine, 1);
    expect(later.day.warmups[0]!.items.map((item) => item.displayName)).toEqual(method ? ['Cat cow', 'Extra'] : ['Cat cow']);
    const untouched = await db.warmupTemplateItem.count({ where: { templateId: library.id, archivedAt: null } });
    expect(untouched).toBe(2);
  });

  it('does not change the warm-up another client or day still shares', async () => {
    const { library, prisma, routine } = await setup();
    const scope = await scopeOf(prisma, routine, 0);
    await removeWarmupItem(scope, prisma, scope.day.warmups[0]!.items[0]!.id);
    expect(await db.planDayWarmup.count({ where: { warmupTemplateId: library.id } })).toBeGreaterThanOrEqual(1);
    const template = await db.planDay.findFirstOrThrow({
      where: { templateId: fixture.template.id, dayIndex: 1 },
      include: { warmups: { include: { warmupTemplate: { include: { items: true } } } } },
    });
    expect(template.warmups[0]!.warmupTemplate.items).toHaveLength(2);
  });

  it('shows the client copy warm-up and group on the session for that date', async () => {
    const { library, prisma, routine } = await setup();
    const scope = await scopeOf(prisma, routine, 0);
    const band = scope.day.warmups[0]!.items.find((item) => item.displayName === 'Band pull')!;
    await patchWarmupSet(scope, prisma, band.id, band.sets[1]!.id, { reps: 15 });
    await db.planStrengthExercise.create({
      data: { dayId: scope.day.id, displayName: 'Row', sortOrder: 1 },
    });
    const grouped = await scopeOf(prisma, routine, 0);
    await setExerciseGroup(prisma, routine, grouped.week, 1, {
      groupType: 'SUPERSET',
      items: grouped.day.exercises.map((exercise) => ({ id: exercise.id, kind: 'exercise' as const })),
    });
    const libraryDay = await db.planDay.findFirstOrThrow({
      where: { dayIndex: 1, templateId: fixture.template.id },
    });
    const created = await fixture.create();
    await db.sessionInstance.update({
      data: { planDayId: libraryDay.id, planDayIndex: 1, planDayTitle: 'Day 1', sessionDate: scope.week.startsOn },
      where: { id: created.id },
    });
    const row = await db.sessionInstance.findUniqueOrThrow({ include: sessionInclude(), where: { id: created.id } });
    const session = await mapSessionWithGroups(db, row);
    const edited = session.warmups?.flatMap((warmup) => warmup.exercises).find((item) => item.displayName === 'Band pull');
    expect(edited?.sets.map((set) => set.reps)).toEqual([10, 15]);
    expect(session.items[0]?.groupType).toBe('SUPERSET');
    const libraryWarmup = await db.warmupTemplateItem.findFirstOrThrow({
      where: { displayName: 'Band pull', templateId: library.id },
    });
    expect(libraryWarmup.metadataJson).toEqual(library.items.find((item) => item.displayName === 'Band pull')!.metadataJson);
  });
});
