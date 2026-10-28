import { PrismaClient } from '@prisma/client';
import { CARDIO_DEFAULT_LOCKED_VARIABLES, SPORT_DEFAULT_LOCKED_VARIABLES } from '@trainerpro/shared';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import { recordRoutineAssignment } from '../../src/modules/plans/infra/prisma/routine-revision.prisma';
import { SessionsCardioRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions-cardio.repository.prisma';
import { SessionsRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions.repository.prisma';
import { sessionFixture } from './session-transitions.fixture';

const url = process.env.TEST_SESSION_DATABASE_URL;
const postgres = url ? describe : describe.skip;
jest.setTimeout(20000);

type Fixture = Awaited<ReturnType<typeof sessionFixture>>;

postgres('heart-rate bands on a published routine', () => {
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

  it('shows the prescription and reads back an exact series and a range', async () => {
    await publishBandDay(db, fixture);
    const cardioRepo = new SessionsCardioRepositoryPrisma(db as PrismaService);
    const repo = new SessionsRepositoryPrisma(db as PrismaService, cardioRepo);
    const session = await repo.ensureSessionForClient(fixture.context, {
      clientId: fixture.client.id,
      coachMembershipId: fixture.member.id,
      organizationId: fixture.org.id,
      sessionDate: new Date('2026-10-28'),
      templateId: fixture.template.id,
    });
    const cardio = session.items.find((item) => item.type === 'cardio');
    const sport = session.items.find((item) => item.type === 'sport');
    expect(cardio?.type === 'cardio' && cardio.plannedSets[0]).toMatchObject({
      fcMaxPct: 60,
      fcMaxPctMax: 70,
      fcReservePct: 50,
      fcReservePctMax: 60,
      heartRate: 130,
      heartRateMax: 150,
    });
    expect(sport?.type === 'sport' && sport.plannedSets[0]).toMatchObject({ fcMaxPct: 70, fcMaxPctMax: 80 });
    if (!cardio || cardio.type !== 'cardio' || !sport || sport.type !== 'sport') throw new Error('Missing blocks');
    await repo.startSession(fixture.context, { sessionId: session.id });
    await repo.logInterval(fixture.context, exactInterval(session.id, cardio.id));
    await repo.logInterval(fixture.context, rangeInterval(session.id, cardio.id));
    await repo.logSportSet(fixture.context, {
      hrMaxPctDone: 70,
      hrMaxPctDoneMax: 80,
      sessionId: session.id,
      sessionSportBlockId: sport.id,
      setIndex: 1,
    });
    const saved = await repo.getSessionById(fixture.context, session.id);
    const savedCardio = saved?.items.find((item) => item.type === 'cardio');
    const savedSport = saved?.items.find((item) => item.type === 'sport');
    expect(savedCardio?.type === 'cardio' && savedCardio.intervalLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ avgHeartRate: 140, avgHeartRateMax: null, intervalIndex: 1 }),
        expect.objectContaining({
          avgHeartRate: 130,
          avgHeartRateMax: 150,
          hrMaxPctDone: 60,
          hrMaxPctDoneMax: 70,
          hrReservePctDone: 50,
          hrReservePctDoneMax: 60,
          intervalIndex: 2,
        }),
      ]),
    );
    expect(savedSport?.type === 'sport' && savedSport.setLogs).toEqual(
      expect.arrayContaining([expect.objectContaining({ hrMaxPctDone: 70, hrMaxPctDoneMax: 80, setIndex: 1 })]),
    );
  });
});

async function publishBandDay(db: PrismaClient, fixture: Fixture) {
  await db.planDay.create({
    data: {
      templateId: fixture.template.id,
      dayIndex: 0,
      title: 'Día 1',
      cardioBlocks: {
        create: {
          displayName: 'Rodar',
          workSeconds: 300,
          lockedFieldsJson: CARDIO_DEFAULT_LOCKED_VARIABLES,
          sortOrder: 0,
          sets: {
            create: {
              setIndex: 0,
              heartRate: 130,
              heartRateMax: 150,
              fcMaxPct: 60,
              fcMaxPctMax: 70,
              fcReservePct: 50,
              fcReservePctMax: 60,
            },
          },
        },
      },
      sportBlocks: {
        create: {
          displayName: 'Fútbol',
          durationMinutes: 0,
          lockedFieldsJson: SPORT_DEFAULT_LOCKED_VARIABLES,
          sortOrder: 1,
          sets: { create: { setIndex: 0, fcMaxPct: 70, fcMaxPctMax: 80 } },
        },
      },
    },
  });
  await db.$transaction((tx) => recordRoutineAssignment(tx, fixture.client.id, fixture.template.id, fixture.user.id));
}

function exactInterval(sessionId: string, blockId: string) {
  return {
    avgHeartRate: 140,
    hrMaxPctDone: 65,
    hrReservePctDone: 55,
    intervalIndex: 1,
    sessionCardioBlockId: blockId,
    sessionId,
  };
}

function rangeInterval(sessionId: string, blockId: string) {
  return {
    avgHeartRate: 130,
    avgHeartRateMax: 150,
    hrMaxPctDone: 60,
    hrMaxPctDoneMax: 70,
    hrReservePctDone: 50,
    hrReservePctDoneMax: 60,
    intervalIndex: 2,
    sessionCardioBlockId: blockId,
    sessionId,
  };
}
