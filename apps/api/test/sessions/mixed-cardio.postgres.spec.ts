import { PrismaClient } from '@prisma/client';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import { SessionsRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions.repository.prisma';
import { SessionsCardioRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions-cardio.repository.prisma';
import { sessionFixture } from './session-transitions.fixture';

const url = process.env.TEST_SESSION_DATABASE_URL;
const postgres = url ? describe : describe.skip;
jest.setTimeout(20000);

postgres('cardio inside routine sessions against PostgreSQL', () => {
  let db: PrismaClient;
  let fixture: Awaited<ReturnType<typeof sessionFixture>>;
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

  it.each([false, true])('preserves prescribed and performed cardio distance (with sport: %s)', async (withSport) => {
    const day = await db.planDay.create({
      data: {
        templateId: fixture.template.id,
        dayIndex: withSport ? 1 : 0,
        title: 'Distance regression',
        cardioBlocks: {
          create: {
            displayName: 'Run',
            workSeconds: 150,
            lockedFieldsJson: ['fcReservePct'],
            sets: { create: { setIndex: 0, distanceMeters: 1250, durationSeconds: 150 } },
          },
        },
        ...(withSport ? { sportBlocks: { create: { displayName: 'Sport', durationMinutes: 0 } } } : {}),
      },
    });
    const repo = new SessionsRepositoryPrisma(db as PrismaService, new SessionsCardioRepositoryPrisma(db as PrismaService));
    const input = {
      clientId: fixture.client.id,
      templateId: fixture.template.id,
      planDayId: day.id,
      coachMembershipId: fixture.member.id,
      organizationId: fixture.org.id,
      sessionDate: new Date(),
    };
    const session = await repo.ensureSessionForClient(fixture.context, input);
    const cardio = session.items.find((item) => item.type === 'cardio');
    expect(cardio).toBeDefined();
    if (!cardio || cardio.type !== 'cardio') throw new Error('Missing cardio');
    expect(cardio.plannedSets[0]).toMatchObject({ distanceMeters: 1250, durationSeconds: 150 });
    await repo.startSession(fixture.context, { sessionId: session.id });
    const log = await repo.logInterval(fixture.context, {
      sessionId: session.id,
      sessionCardioBlockId: cardio.id,
      intervalIndex: 0,
      distanceDoneMeters: 1532,
      durationSecondsDone: 150,
    });
    expect(log).toMatchObject({ distanceDoneMeters: 1532, durationSecondsDone: 150 });
    if (withSport) {
      const sport = session.items.find((item) => item.type === 'sport');
      if (!sport) throw new Error('Missing sport');
      await repo.logSportSet(fixture.context, {
        sessionId: session.id,
        sessionSportBlockId: sport.id,
        setIndex: 0,
        distanceDoneMeters: 2400,
      });
    }
    const reloaded = await repo.getSessionById(fixture.context, session.id);
    const saved = reloaded?.items.find((item) => item.type === 'cardio');
    expect(saved?.type === 'cardio' && saved.intervalLogs[0]).toMatchObject({ distanceDoneMeters: 1532 });
    if (withSport) {
      const sport = reloaded?.items.find((item) => item.type === 'sport');
      expect(sport?.type === 'sport' && sport.setLogs[0]).toMatchObject({
        distanceDoneMeters: 2400,
        durationSecondsDone: null,
        repsDone: null,
      });
    }
    expect(await repo.getCardioSessionById(fixture.context, session.id)).toBeNull();
  });
});
