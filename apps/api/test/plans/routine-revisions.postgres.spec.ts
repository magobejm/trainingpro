import { PrismaClient } from '@prisma/client';
import { sessionFixture } from '../sessions/session-transitions.fixture';
import { PlansRoutineRepository } from '../../src/modules/plans/infra/prisma/plans-repository/plans-routine.repository';
import { ClientRepositoryPrisma } from '../../src/modules/clients/infra/prisma/client.repository.prisma';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import { ClearFutureWorkoutsUseCase } from '../../src/modules/calendar/application/use-cases/clear-future-workouts.usecase';
import {
  mapSessionWithGroups,
  sessionInclude,
} from '../../src/modules/sessions/infra/prisma/sessions-strength.prisma.helpers';

const postgres = process.env.TEST_SESSION_DATABASE_URL ? describe : describe.skip;
// eslint-disable-next-line max-lines-per-function
postgres('immutable assigned routine revisions', () => {
  let db: PrismaClient;
  let fixture: Awaited<ReturnType<typeof sessionFixture>>;
  beforeAll(async () => {
    const url = new URL(process.env.TEST_SESSION_DATABASE_URL!);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Requires local PostgreSQL');
    url.searchParams.set('connection_limit', '1');
    db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  });
  beforeEach(async () => {
    fixture = await sessionFixture(db);
  });
  afterEach(async () => {
    if (fixture) {
      await db.calendarEvent.deleteMany({ where: { clientId: fixture.client.id } });
      await db.client.update({ where: { id: fixture.client.id }, data: { activeRoutineAssignmentId: null } });
      await db.routineAssignment.deleteMany({ where: { clientId: fixture.client.id } });
      await db.routineRevision.deleteMany({ where: { templateId: fixture.template.id } });
      await fixture.cleanup();
    }
  });
  afterAll(async () => {
    await db?.$disconnect();
  });
  it('keeps the applied day and its content when the source is saved again', async () => {
    const day = await db.planDay.create({
      data: {
        templateId: fixture.template.id,
        dayIndex: 1,
        title: 'Original day',
        exercises: { create: { displayName: 'Squat', repsMin: 8 } },
      },
    });
    const coach = { ...fixture.context, activeRole: 'coach' as const, roles: ['coach' as const] };
    const clients = new ClientRepositoryPrisma(db as PrismaService);
    await clients.updateClient(coach, fixture.client.id, { trainingPlanId: fixture.template.id });
    const event = await db.calendarEvent.create({
      data: {
        clientId: fixture.client.id,
        coachMembershipId: fixture.member.id,
        date: new Date('2026-10-17'),
        type: 'workout',
        planDayId: day.id,
      },
    });
    const session = await fixture.create(new Date());
    await db.sessionInstance.update({ where: { id: session.id }, data: { planDayId: day.id } });
    const started = await db.sessionInstance.findUniqueOrThrow({ where: { id: session.id }, include: { items: true } });
    const plans = new PlansRoutineRepository(db as PrismaService);
    await plans.updateRoutineTemplate(coach, fixture.template.id, {
      name: 'Updated plan',
      expectedTemplateVersion: 1,
      days: [
        {
          dayIndex: 1,
          title: 'Changed day',
          exercises: [],
          cardioBlocks: [],
          plioBlocks: [],
          mobilityBlocks: [],
          isometricBlocks: [],
          sportBlocks: [],
        },
      ],
    });
    const applied = await clients.findClientRoutineByEmail(fixture.client.email);
    expect(applied?.planDays[0]?.id).toBe(day.id);
    expect(applied?.planDays[0]?.title).toBe('Original day');
    expect(await db.planDay.findUnique({ where: { id: day.id } })).not.toBeNull();
    expect(await db.routineAssignment.count({ where: { clientId: fixture.client.id } })).toBe(1);
    const preview = await new ClearFutureWorkoutsUseCase(db as PrismaService).execute(coach, {
      clientId: fixture.client.id,
      from: '2026-10-17',
      dryRun: true,
      candidateTemplateId: fixture.template.id,
    });
    expect(preview).toMatchObject({ appliedRoutine: { version: 1 }, candidateRoutine: { version: 2 } });
    if (!('signature' in preview)) throw new Error('Expected preview');
    await clients.updateClient(coach, fixture.client.id, {
      trainingPlanId: fixture.template.id,
      routineHandoff: {
        mode: 'continue',
        from: '2026-10-17',
        expectedSignature: preview.signature,
        candidateTemplateId: fixture.template.id,
      },
    });
    expect((await clients.findClientRoutineByEmail(fixture.client.email))?.planDays[0]?.title).toBe('Changed day');
    expect(await db.routineAssignment.count({ where: { clientId: fixture.client.id } })).toBe(2);
    expect(await db.sessionInstance.findUniqueOrThrow({ where: { id: session.id }, include: { items: true } })).toEqual(
      started,
    );
    expect((await db.calendarEvent.findUniqueOrThrow({ where: { id: event.id } })).planDayId).toBe(day.id);
    expect((await db.calendarEvent.findUniqueOrThrow({ where: { id: event.id } })).archivedAt).toBeNull();
    await db.planTemplate.update({ where: { id: fixture.template.id }, data: { templateVersion: { increment: 1 } } });
    await expect(
      clients.updateClient(coach, fixture.client.id, {
        trainingPlanId: fixture.template.id,
        routineHandoff: {
          mode: 'replace',
          from: '2026-10-17',
          expectedSignature: preview.signature,
          candidateTemplateId: fixture.template.id,
        },
      }),
    ).rejects.toMatchObject({ status: 409 });
    expect(await db.routineAssignment.count({ where: { clientId: fixture.client.id } })).toBe(2);
  });

  it('freezes linked warmups and library instructions for the applied revision', async () => {
    const exercise = await db.exercise.create({
      data: {
        scope: 'COACH',
        coachMembershipId: fixture.member.id,
        name: 'Instruction snapshot',
        coachInstructions: 'Original instructions',
      },
    });
    const warmup = await db.warmupTemplate.create({
      data: {
        name: 'Original warmup',
        coachMembershipId: fixture.member.id,
        items: {
          create: {
            blockType: 'strength',
            displayName: 'Warm up',
            exerciseLibraryId: exercise.id,
            repsMin: 5,
            setsPlanned: 2,
            metadataJson: {
              sets: [
                { setIndex: 0, reps: 8, weightKg: 10 },
                { setIndex: 1, reps: 6, weightKg: 12 },
              ],
            },
          },
        },
      },
    });
    const day = await db.planDay.create({
      data: {
        templateId: fixture.template.id,
        dayIndex: 1,
        title: 'Original',
        exercises: { create: { displayName: 'Squat', exerciseLibraryId: exercise.id } },
        warmups: { create: { warmupTemplateId: warmup.id } },
      },
    });
    try {
      const coach = { ...fixture.context, activeRole: 'coach' as const, roles: ['coach' as const] };
      const clients = new ClientRepositoryPrisma(db as PrismaService);
      await clients.updateClient(coach, fixture.client.id, { trainingPlanId: fixture.template.id });
      await db.exercise.update({ where: { id: exercise.id }, data: { coachInstructions: 'Changed instructions' } });
      await db.warmupTemplate.update({ where: { id: warmup.id }, data: { name: 'Changed warmup' } });
      const reference = await db.planDayWarmup.findFirstOrThrow({
        where: { planDayId: day.id },
        include: { warmupTemplate: true },
      });
      expect(reference.warmupTemplate.isRevision).toBe(true);
      expect(reference.warmupTemplate.name).toBe('Original warmup');
      const applied = await clients.findClientRoutineByEmail(fixture.client.email);
      expect(applied?.planDays[0]?.exercises[0]?.coachInstructions).toBe('Original instructions');
      const warmups = applied?.planDays[0]?.warmups;
      expect(warmups?.[0]?.name).toBe('Original warmup');
      expect(warmups?.[0]?.exercises[0]).toMatchObject({
        displayName: 'Warm up',
        coachInstructions: 'Original instructions',
        setsPlanned: 2,
      });
      expect(warmups?.[0]?.exercises[0]?.sets.map((set) => set.reps)).toEqual([8, 6]);
      const created = await fixture.create(new Date());
      await db.sessionInstance.update({
        where: { id: created.id },
        data: { planDayId: day.id, planDayIndex: 1, planDayTitle: 'Original' },
      });
      const row = await db.sessionInstance.findUniqueOrThrow({ where: { id: created.id }, include: sessionInclude() });
      const session = await mapSessionWithGroups(db, row);
      expect(session.warmups).toEqual(warmups);
      expect(session.items).toHaveLength(1);
      expect(await db.setLog.count({ where: { sessionItem: { sessionId: created.id } } })).toBe(0);
      await db.planDay.update({ where: { id: day.id }, data: { archivedAt: new Date() } });
      expect((await mapSessionWithGroups(db, row)).warmups).toEqual(warmups);
    } finally {
      await db.planDayWarmup.deleteMany({ where: { planDayId: day.id } });
      await db.warmupTemplate.deleteMany({ where: { coachMembershipId: fixture.member.id } });
      await db.exercise.delete({ where: { id: exercise.id } });
    }
  });

  it('captures a legacy reference without invalidating its reviewed assignment', async () => {
    await db.planDay.create({ data: { templateId: fixture.template.id, dayIndex: 1, title: 'Legacy' } });
    await db.client.update({ where: { id: fixture.client.id }, data: { trainingPlanId: fixture.template.id } });
    const coach = { ...fixture.context, activeRole: 'coach' as const, roles: ['coach' as const] };
    const preview = await new ClearFutureWorkoutsUseCase(db as PrismaService).execute(coach, {
      clientId: fixture.client.id,
      from: '2026-10-17',
      dryRun: true,
      candidateTemplateId: fixture.template.id,
    });
    if (!('signature' in preview)) throw new Error('Expected preview');
    expect(preview.appliedRoutine?.initial).toBe(true);
    await new ClientRepositoryPrisma(db as PrismaService).updateClient(coach, fixture.client.id, {
      trainingPlanId: fixture.template.id,
      routineHandoff: {
        mode: 'continue',
        from: '2026-10-17',
        expectedSignature: preview.signature,
        candidateTemplateId: fixture.template.id,
      },
    });
    const assignments = await db.routineAssignment.findMany({ where: { clientId: fixture.client.id } });
    expect(assignments).toHaveLength(1);
    expect(assignments[0]?.initial).toBe(true);
  });
});
