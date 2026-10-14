import { SessionsRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions.repository.prisma';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import type { SessionsCardioRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions-cardio.repository.prisma';

describe('exercise history', () => {
  it('keeps every actual set, including zero values and repeated exercises, per session', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'session-1',
        sessionDate: new Date('2026-10-12'),
        items: [
          {
            id: 'item-1',
            logs: [
              { setIndex: 1, repsDone: 12, weightDoneKg: 0, effortRpe: 7.5, effortRir: 0, restSecondsDone: 60 },
              { setIndex: 2, repsDone: 10, weightDoneKg: 25, effortRpe: 8, effortRir: 1, restSecondsDone: 90 },
            ],
          },
          { id: 'item-2', logs: [{ setIndex: 1, repsDone: 8, weightDoneKg: 30 }] },
        ],
        cardioBlocks: [],
        plioBlocks: [],
        mobilityBlocks: [],
        isometricBlocks: [],
        sportBlocks: [],
      },
    ]);
    const repo = new SessionsRepositoryPrisma(
      {
        sessionInstance: { findMany },
        setLog: {
          findMany: jest.fn().mockResolvedValue([
            {
              session: { sessionDate: new Date('2026-10-12') },
              setIndex: 2,
              repsDone: 10,
              weightDoneKg: 25,
              effortRpe: 8,
              effortRir: 1,
            },
          ]),
        },
      } as unknown as PrismaService,
      {} as SessionsCardioRepositoryPrisma,
    );
    const result = await repo.findExerciseHistory('client-1', 'exercise-1', 5, 'current');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      sessionId: 'session-1',
      sets: [
        { itemId: 'item-1', setIndex: 1, repsDone: 12, weightDoneKg: 0, effortRir: 0, restSecondsDone: 60 },
        { itemId: 'item-1', setIndex: 2, repsDone: 10, weightDoneKg: 25 },
        { itemId: 'item-2', setIndex: 1, repsDone: 8, weightDoneKg: 30 },
      ],
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        where: expect.objectContaining({
          clientId: 'client-1',
          archivedAt: null,
          status: 'COMPLETED',
          id: { not: 'current' },
        }),
        orderBy: [{ sessionDate: 'desc' }, { finishedAt: 'desc' }, { id: 'desc' }],
      }),
    );
  });
});

describe('exercise history across exercise types', () => {
  it('returns all recorded variables for other exercise types and preserves separate sessions on one date', async () => {
    const base = {
      sessionDate: new Date('2026-10-10'),
      items: [],
      cardioBlocks: [],
      plioBlocks: [],
      mobilityBlocks: [],
      isometricBlocks: [],
      sportBlocks: [],
    };
    const findMany = jest.fn().mockResolvedValue([
      {
        ...base,
        id: 'sport',
        sportBlocks: [
          {
            id: 'sport-block',
            setLogs: [
              {
                setIndex: 2,
                durationSecondsDone: 90,
                heartRateDone: 140,
                hrMaxPctDone: 80,
                hrReservePctDone: 65,
                romDone: '3',
                restSecondsDone: 0,
                effortRpe: 6.5,
              },
            ],
          },
        ],
      },
      {
        ...base,
        id: 'cardio',
        cardioBlocks: [
          {
            id: 'cardio-block',
            intervalLogs: [{ intervalIndex: 1, distanceDoneMeters: 200, avgHeartRate: 130, durationSecondsDone: 60 }],
          },
        ],
      },
    ]);
    const repo = new SessionsRepositoryPrisma(
      {
        sessionInstance: { findMany },
        setLog: {
          findMany: jest.fn().mockResolvedValue([
            {
              session: { sessionDate: new Date('2026-10-12') },
              setIndex: 2,
              repsDone: 10,
              weightDoneKg: 25,
              effortRpe: 8,
              effortRir: 1,
            },
          ]),
        },
      } as unknown as PrismaService,
      {} as SessionsCardioRepositoryPrisma,
    );
    const result = await repo.findExerciseHistory('client', 'exercise', 5);
    expect(result.map((entry) => entry.sessionId)).toEqual(['sport', 'cardio']);
    expect(result[0]!.sets[0]).toMatchObject({
      setIndex: 2,
      durationSecondsDone: 90,
      heartRateDone: 140,
      hrMaxPctDone: 80,
      hrReservePctDone: 65,
      romDone: '3',
      restSecondsDone: 0,
      effortRpe: 6.5,
    });
    expect(result[1]!.sets[0]).toMatchObject({ setIndex: 1, distanceDoneMeters: 200, heartRateDone: 130 });
  });
});
