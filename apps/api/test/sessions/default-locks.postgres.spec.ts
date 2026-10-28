import { PrismaClient } from '@prisma/client';
import { CARDIO_DEFAULT_LOCKED_VARIABLES, SPORT_DEFAULT_LOCKED_VARIABLES } from '@trainerpro/shared';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import { recordRoutineAssignment } from '../../src/modules/plans/infra/prisma/routine-revision.prisma';
import { cardioMetricDistance } from '../../src/modules/progress/application/dashboard-session';
import { aggregateDailyExercise } from '../../src/modules/progress/domain/metrics/daily-exercise';
import { SessionsCardioRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions-cardio.repository.prisma';
import { SessionsRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions.repository.prisma';
import { sessionFixture } from './session-transitions.fixture';

const url = process.env.TEST_SESSION_DATABASE_URL;
const postgres = url ? describe : describe.skip;
jest.setTimeout(20000);

type Fixture = Awaited<ReturnType<typeof sessionFixture>>;
type Interval = { distanceDoneMeters: number | null; durationSecondsDone: number | null };

postgres('published routine locks on the client session', () => {
  let db: PrismaClient;
  let fixture: Fixture;

  beforeAll(async () => {
    const local = new URL(url!);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(local.hostname)) throw new Error('Requires a local test database');
    db = new PrismaClient({ datasources: { db: { url: local.toString() } } });
    fixture = await sessionFixture(db);
    await db.planTemplate.update({ where: { id: fixture.template.id }, data: { kind: 'ROUTINE' } });
  });

  afterAll(async () => {
    try {
      if (fixture) await fixture.cleanup();
    } finally {
      await db?.$disconnect();
    }
  });

  it('opens the web routine on mobile with sport rest, locked duration and cardio distance per series', async () => {
    await publishDefaultDay(db, fixture);
    const repo = new SessionsRepositoryPrisma(db as PrismaService, new SessionsCardioRepositoryPrisma(db as PrismaService));
    const session = await repo.ensureSessionForClient(fixture.context, {
      clientId: fixture.client.id,
      coachMembershipId: fixture.member.id,
      organizationId: fixture.org.id,
      sessionDate: new Date('2026-10-28'),
      templateId: fixture.template.id,
    });
    const sport = session.items.find((item) => item.type === 'sport');
    const cardio = session.items.find((item) => item.type === 'cardio');
    expect(sport?.type === 'sport' && sport.lockedFields).toEqual(SPORT_DEFAULT_LOCKED_VARIABLES);
    expect(sport?.type === 'sport' && sport.plannedSets[0]).toMatchObject({ distanceMeters: 400, restSeconds: 45 });
    expect(cardio?.type === 'cardio' && cardio.lockedFields).toEqual(CARDIO_DEFAULT_LOCKED_VARIABLES);
    expect(cardio?.type === 'cardio' && cardio.plannedSets.map((set) => set.distanceMeters)).toEqual([1000, 1000]);
    expect(cardio?.type === 'cardio' && cardio.distanceDoneMeters).toBeNull();
    expect(cardio?.type === 'cardio' && cardio.targetDistanceMeters).toBeNull();
    if (!cardio || cardio.type !== 'cardio') throw new Error('Missing cardio');
    await repo.startSession(fixture.context, { sessionId: session.id });
    await repo.logInterval(fixture.context, interval(session.id, cardio.id, 0, 1000));
    await repo.logInterval(fixture.context, interval(session.id, cardio.id, 1, 1500));
    const saved = (await repo.getSessionById(fixture.context, session.id))?.items.find((item) => item.type === 'cardio');
    if (!saved || saved.type !== 'cardio') throw new Error('Missing saved cardio');
    expect(seriesPace(saved.intervalLogs, saved.distanceDoneMeters ?? null)).toMatchObject({
      avgPaceMinKm: 4,
      distanceMeters: 2500,
    });
  });
});

async function publishDefaultDay(db: PrismaClient, fixture: Fixture) {
  await db.planDay.create({
    data: {
      templateId: fixture.template.id,
      dayIndex: 0,
      title: 'Día 1',
      sportBlocks: {
        create: {
          displayName: 'Fútbol',
          durationMinutes: 0,
          lockedFieldsJson: SPORT_DEFAULT_LOCKED_VARIABLES,
          sortOrder: 0,
          sets: { create: { setIndex: 0, distanceMeters: 400, restSeconds: 45 } },
        },
      },
      cardioBlocks: {
        create: {
          displayName: 'Rodar',
          workSeconds: 300,
          lockedFieldsJson: CARDIO_DEFAULT_LOCKED_VARIABLES,
          sortOrder: 1,
          targetDistanceMeters: null,
          sets: {
            create: [
              { setIndex: 0, distanceMeters: 1000 },
              { setIndex: 1, distanceMeters: 1000 },
            ],
          },
        },
      },
    },
  });
  await db.$transaction((tx) => recordRoutineAssignment(tx, fixture.client.id, fixture.template.id, fixture.user.id));
}

function interval(sessionId: string, blockId: string, intervalIndex: number, distanceDoneMeters: number) {
  return {
    distanceDoneMeters,
    durationSecondsDone: 300,
    intervalIndex,
    sessionCardioBlockId: blockId,
    sessionId,
  };
}

function seriesPace(logs: Interval[], header: number | null) {
  const distances = logs.map((log) => log.distanceDoneMeters);
  return aggregateDailyExercise(
    'cardio',
    logs.map((log, index) => ({
      distanceMeters: log.distanceDoneMeters,
      durationSeconds: log.durationSecondsDone,
      fcMaxPercent: null,
      fcReservePercent: null,
      heartRate: null,
      incomplete: false,
      metricDistanceMeters: cardioMetricDistance(header, distances, index),
      reps: null,
      restSeconds: null,
      rir: null,
      rom: null,
      rpe: null,
      sessionDate: '2026-10-28',
      sessionId: 'session',
      sessionTitle: 'Día 1',
      setIndex: index + 1,
      weightKg: null,
    })),
  )[0];
}
