import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import { readSportProgress } from '../../src/modules/progress/infra/prisma/progress-exercise-types.helpers';
import { estimateE1rm, calculateSetInol } from '../../src/modules/progress/domain/metrics/exercise-metrics';

function set(values: Record<string, unknown>) {
  return {
    durationSecondsDone: null,
    distanceDoneMeters: null,
    heartRateDone: null,
    effortRpe: null,
    effortRir: null,
    repsDone: null,
    weightDoneKg: null,
    ...values,
  };
}
async function progress(sets: ReturnType<typeof set>[]) {
  const date = new Date('2026-10-20T00:00:00Z');
  const prisma = {
    sessionSportBlock: {
      findMany: jest
        .fn()
        .mockResolvedValue([
          {
            sessionId: 'session',
            session: { sessionDate: date, isIncomplete: true, isCompleted: false, status: 'COMPLETED', skippedAt: null },
            setLogs: sets,
            logs: [],
          },
        ]),
    },
  };
  return readSportProgress(
    prisma as unknown as PrismaService,
    'client',
    { exerciseId: 'sport', exerciseType: 'sport', from: date, to: date },
    { fcMax: null, fcRest: null },
  );
}
test('sport pace never joins duration and distance from different sets', async () => {
  const [point] = await progress([set({ durationSecondsDone: 300 }), set({ distanceDoneMeters: 1000 })]);
  expect(point?.avgPaceMinKm).toBeNull();
  expect(point?.metricCoverage?.avgPaceMinKm).toEqual({ validSamples: 0, eligibleSamples: 2, unit: 'intervals' });
  expect(point?.totalDurationSeconds).toBe(300);
});
test('sport pace uses only pairs even when other sets have unmatched totals', async () => {
  const [point] = await progress([
    set({ durationSecondsDone: 600, distanceDoneMeters: 2000 }),
    set({ durationSecondsDone: 1200 }),
    set({ distanceDoneMeters: 1000 }),
  ]);
  expect(point?.avgPaceMinKm).toBe(5);
  expect(point?.metricCoverage?.avgPaceMinKm?.validSamples).toBe(1);
});
test('sport strength metrics retain registered RIR and its precedence over RPE', async () => {
  const expected = estimateE1rm(50, 5, null, 2)!;
  for (const effortRpe of [null, new Prisma.Decimal(10)]) {
    const [point] = await progress([set({ weightDoneKg: new Prisma.Decimal(50), repsDone: 5, effortRir: 2, effortRpe })]);
    expect(point?.e1rm).toBe(expected);
    expect(point?.inol).toBe(calculateSetInol(50, 5, expected));
    expect(point?.metricCoverage?.e1rm?.validSamples).toBe(1);
  }
});
test('sport distance-only sets remain recorded with absent derived metrics', async () => {
  const [point] = await progress([set({ distanceDoneMeters: 1250 })]);
  expect(point?.sets).toBe(1);
  expect(point?.hasRecordedData).toBe(true);
  expect(point?.avgPaceMinKm).toBeNull();
  expect(point?.e1rm).toBeNull();
  expect(point?.inol).toBeNull();
  expect(point?.totalDurationSeconds).toBeNull();
  expect(point?.metricCoverage?.totalDistanceMeters?.validSamples).toBe(1);
});
