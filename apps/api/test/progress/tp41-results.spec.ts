import { Prisma } from '@prisma/client';
import { strengthSetHasData, sportSetHasData } from '../../src/common/performed-set';
import { aggregateExerciseSets, estimateE1rm } from '../../src/modules/progress/domain/metrics/exercise-metrics';
import { ProgressRepositoryPrisma } from '../../src/modules/progress/infra/prisma/progress.repository.prisma';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
jest.mock('../../src/modules/sessions/infra/prisma/session-stale', () => ({
  closeStaleSessions: jest.fn().mockResolvedValue(undefined),
}));
const date = new Date('2026-10-20T00:00:00Z');
const context = { activeRole: 'client', email: 'client@test.com', subject: 'uid' } as AuthContext;
function session(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session',
    sessionDate: date,
    clientId: 'client',
    planDayId: null,
    updatedAt: date,
    skipReason: null,
    isCompleted: false,
    isIncomplete: false,
    skippedAt: null,
    status: 'NOT_STARTED',
    startedAt: null,
    finishedAt: null,
    client: null,
    logs: [],
    intervalLogs: [],
    plioLogs: [],
    mobilityLogs: [],
    isometricLogs: [],
    sportLogs: [],
    sportSetLogs: [],
    items: [],
    ...overrides,
  };
}
function repository(rows: unknown[]) {
  const prisma = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    setLog: { findMany: jest.fn().mockResolvedValue([]) },
    calendarEvent: { findMany: jest.fn().mockResolvedValue([]) },
    client: { findFirst: jest.fn().mockResolvedValue({ id: 'client' }) },
    sessionInstance: { findMany: jest.fn().mockResolvedValue(rows) },
  };
  return { repo: new ProgressRepositoryPrisma(prisma as unknown as PrismaService), prisma };
}
test('retains RIR zero, unloaded sets, and distance-only sport sets', () => {
  expect(strengthSetHasData({ effortRir: 0 })).toBe(true);
  expect(strengthSetHasData({ weightDoneKg: 0 })).toBe(true);
  expect(sportSetHasData({ distanceDoneMeters: 1250 })).toBe(true);
  const point = aggregateExerciseSets('id', date, [
    { setIndex: 1, repsDone: 10, weightDoneKg: 0, effortRpe: null },
    { setIndex: 2, repsDone: null, weightDoneKg: 30, effortRpe: 8 },
  ]);
  expect(point.tonnage).toBe(0);
  expect(point.metricCoverage?.tonnage).toEqual({ validSamples: 1, eligibleSamples: 2, unit: 'sets' });
  expect(point.setDetails[1]?.tonnage).toBeNull();
});
test('does not infer missing effort and accepts RIR zero for e1rm', () => {
  expect(estimateE1rm(80, 5, null)).toBeNull();
  expect(estimateE1rm(80, 5, null, 0)).not.toBeNull();
});
test('does not invent totals for RPE-only recordings', () => {
  const point = aggregateExerciseSets('id', date, [{ setIndex: 1, repsDone: null, weightDoneKg: null, effortRpe: 8 }]);
  expect(point.totalReps).toBeNull();
  expect(point.tonnage).toBeNull();
  expect(point.avgRpe).toBe(8);
});
test('lists all five results and excludes unfinished metrics', async () => {
  const { repo, prisma } = repository([
    session({ id: 'done', isCompleted: true }),
    session({
      id: 'partial',
      isIncomplete: true,
      logs: [{ repsDone: 5, weightDoneKg: new Prisma.Decimal(20), effortRpe: new Prisma.Decimal(8) }],
    }),
    session({ id: 'skip', skippedAt: date }),
    session({ id: 'pending' }),
    session({
      id: 'progress',
      status: 'IN_PROGRESS',
      sportSetLogs: [{ distanceDoneMeters: 1000, effortRir: null, effortRpe: null, weightDoneKg: null }],
    }),
  ]);
  const result = await repo.readRecentSessions(context, { from: date, to: date, limit: 10 });
  expect(prisma.sessionInstance.findMany.mock.calls[0]?.[0].where.OR).toBeUndefined();
  expect(result.map((r) => r.outcome)).toEqual(['done', 'incomplete', 'skipped', 'pending', 'in_progress']);
  expect(result[1]?.totalTonnage).toBe(100);
  expect(result[0]?.totalTonnage).toBeNull();
  expect(result[4]?.hasRecordedData).toBe(true);
  expect(result[4]?.totalTonnage).toBeNull();
});
test('coverage uses the same category and actual observed durations as metrics', async () => {
  const logs = [{ repsDone: 5, weightDoneKg: new Prisma.Decimal(20), effortRpe: new Prisma.Decimal(8) }];
  const { repo } = repository([
    session({
      isCompleted: true,
      client: { fcMax: 190, fcRest: 60 },
      logs,
      sportLogs: [{ durationMinutesDone: 10, effortRpe: new Prisma.Decimal(4), avgHeartRate: null }],
      intervalLogs: [
        { durationSecondsDone: 60, avgHeartRate: 125, effortRpe: null },
        { durationSecondsDone: 600, avgHeartRate: null, effortRpe: null },
        { durationSecondsDone: null, avgHeartRate: 190, effortRpe: null },
      ],
    }),
  ]);
  const [point] = await repo.readSessionProgress(context, { from: date, to: date, templateId: 'template' });
  expect(point?.sessionRpe).toBe(8);
  expect(point?.metricCoverage?.sessionRpe).toEqual({ validSamples: 1, eligibleSamples: 1, unit: 'sets' });
  expect(point?.trainingLoad).toBe(50);
  expect(point?.metricCoverage?.trainingLoad).toEqual({
    validSamples: 1,
    eligibleSamples: 3,
    unit: 'intervals',
    weightSeconds: 60,
  });
});
test('microcycle e1rm coverage counts sets rather than session means', async () => {
  const { repo } = repository([
    session({
      isCompleted: true,
      logs: [
        { repsDone: 5, weightDoneKg: new Prisma.Decimal(20), effortRpe: new Prisma.Decimal(8) },
        { repsDone: 5, weightDoneKg: new Prisma.Decimal(25), effortRpe: new Prisma.Decimal(8) },
        { repsDone: null, weightDoneKg: null, effortRpe: null },
      ],
    }),
    session({ id: 'second', isCompleted: true, logs: [{ repsDone: null, weightDoneKg: null, effortRpe: null }] }),
  ]);
  const result = await repo.readMicrocycleProgress(context, { from: date, to: date });
  expect(result.points[0]?.metricCoverage?.avgE1rm).toEqual({ validSamples: 2, eligibleSamples: 4, unit: 'sets' });
});
test('counts distinct recorded blocks across all types instead of prescribed exercises', async () => {
  const { repo } = repository([
    session({
      id: 'cardio',
      isIncomplete: true,
      intervalLogs: [
        {
          sessionCardioBlockId: 'run',
          durationSecondsDone: 60,
          distanceDoneMeters: null,
          avgHeartRate: null,
          effortRpe: null,
        },
        {
          sessionCardioBlockId: 'run',
          durationSecondsDone: 90,
          distanceDoneMeters: null,
          avgHeartRate: null,
          effortRpe: null,
        },
      ],
    }),
    session({
      id: 'strength',
      isIncomplete: true,
      items: [{ sourceExerciseId: 'prescribed-a' }, { sourceExerciseId: 'prescribed-b' }],
      logs: [
        { sessionItemId: 'recorded-a', repsDone: null, weightDoneKg: null, effortRpe: null, effortRir: 0 },
        { sessionItemId: 'empty-b', repsDone: null, weightDoneKg: null, effortRpe: null, effortRir: null },
      ],
    }),
    session({ id: 'empty', isIncomplete: true, items: [{ sourceExerciseId: 'prescribed-a' }] }),
    session({
      id: 'sport',
      isIncomplete: true,
      sportLogs: [{ sessionSportBlockId: 'ball', durationMinutesDone: 10, effortRpe: null, avgHeartRate: null }],
      sportSetLogs: [
        {
          sessionSportBlockId: 'ball',
          distanceDoneMeters: 500,
          effortRpe: null,
          effortRir: null,
          repsDone: null,
          weightDoneKg: null,
          durationSecondsDone: null,
        },
      ],
    }),
  ]);
  const result = await repo.readRecentSessions(context, { from: date, to: date, limit: 20 });
  expect(result.map((row) => row.exerciseCount)).toEqual([1, 1, 0, 1]);
});
test('paginates after filters and orders same-day sessions deterministically', async () => {
  const { repo, prisma } = repository([]);
  await repo.readRecentSessions(context, {
    from: date,
    to: date,
    limit: 200,
    beforeDate: date,
    beforeId: 'cursor',
    exerciseId: 'exercise',
    dayIndex: 2,
    category: 'cardio',
  });
  const query = prisma.sessionInstance.findMany.mock.calls[0]?.[0];
  expect(query.orderBy).toEqual([{ sessionDate: 'desc' }, { id: 'desc' }]);
  expect(query.where.planDayIndex).toBe(2);
  expect(query.where.AND).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ OR: expect.arrayContaining([{ sessionDate: date, id: { lt: 'cursor' } }]) }),
    ]),
  );
});
test('requires actual heart profile and paired interval samples for load', async () => {
  const { repo } = repository([
    session({
      isIncomplete: true,
      intervalLogs: [{ durationSecondsDone: 300, avgHeartRate: 150, effortRpe: new Prisma.Decimal(8) }],
    }),
  ]);
  const result = await repo.readSessionProgress(context, {
    from: date,
    to: date,
    templateId: 'template',
    category: 'cardio',
  });
  expect(result[0]?.outcome).toBe('incomplete');
  expect(result[0]?.trainingLoad).toBeNull();
  expect(result[0]?.metricCoverage?.trainingLoad?.weightSeconds).toBe(0);
});

test('sport session duration uses observed legacy logs only for blocks without recorded sets', async () => {
  const legacy = (sessionSportBlockId: string, durationMinutesDone: number) => ({
    sessionSportBlockId,
    durationMinutesDone,
    effortRpe: null,
    avgHeartRate: null,
  });
  const sportSet = (sessionSportBlockId: string, overrides: Record<string, unknown> = {}) => ({
    sessionSportBlockId,
    durationSecondsDone: null,
    distanceDoneMeters: null,
    effortRir: null,
    effortRpe: null,
    repsDone: null,
    weightDoneKg: null,
    ...overrides,
  });
  const { repo } = repository([
    session({ id: 'legacy', isIncomplete: true, sportLogs: [legacy('a', 15)] }),
    session({
      id: 'mixed',
      isIncomplete: true,
      sportLogs: [legacy('a', 15), legacy('b', 5)],
      sportSetLogs: [sportSet('a', { durationSecondsDone: 120 }), sportSet('b')],
    }),
    session({
      id: 'distance',
      isIncomplete: true,
      sportLogs: [legacy('a', 15), legacy('b', 5)],
      sportSetLogs: [sportSet('a', { distanceDoneMeters: 1250 })],
    }),
  ]);
  const result = await repo.readSessionProgress(context, {
    from: date,
    to: date,
    templateId: 'template',
    category: 'sport',
  });
  expect(result.map((row) => row.durationMinutes)).toEqual([15, 7, 5]);
  expect(result[0]?.metricCoverage?.durationMinutes).toEqual({ validSamples: 1, eligibleSamples: 1, unit: 'intervals' });
  expect(result[1]?.metricCoverage?.durationMinutes).toEqual({ validSamples: 2, eligibleSamples: 2, unit: 'intervals' });
  expect(result[2]?.metricCoverage?.durationMinutes).toEqual({ validSamples: 1, eligibleSamples: 2, unit: 'intervals' });
});

test('sport RPE chooses recorded sources independently for each block in session and overview', async () => {
  const legacy = (id: string, rpe: number) => ({
    sessionSportBlockId: id,
    durationMinutesDone: 15,
    effortRpe: new Prisma.Decimal(rpe),
    avgHeartRate: null,
  });
  const sportSet = (id: string, rpe: number | null) => ({
    sessionSportBlockId: id,
    durationSecondsDone: null,
    distanceDoneMeters: null,
    effortRir: null,
    effortRpe: rpe === null ? null : new Prisma.Decimal(rpe),
    repsDone: null,
    weightDoneKg: null,
  });
  const { repo } = repository([
    session({
      id: 'mixed',
      isIncomplete: true,
      sportSetLogs: [sportSet('a', 6)],
      sportLogs: [legacy('a', 9), legacy('b', 8)],
    }),
    session({ id: 'empty-set', isIncomplete: true, sportSetLogs: [sportSet('a', null)], sportLogs: [legacy('a', 8)] }),
    session({ id: 'same-block', isIncomplete: true, sportSetLogs: [sportSet('a', 6)], sportLogs: [legacy('a', 9)] }),
  ]);
  const points = await repo.readSessionProgress(context, {
    from: date,
    to: date,
    templateId: 'template',
    category: 'sport',
  });
  expect(points.map((point) => point.sessionRpe)).toEqual([7, 8, 6]);
  expect(points[0]?.metricCoverage?.sessionRpe).toEqual({ validSamples: 2, eligibleSamples: 2, unit: 'intervals' });
  expect(points[1]?.metricCoverage?.sessionRpe).toEqual({ validSamples: 1, eligibleSamples: 1, unit: 'intervals' });
  const srpe = await repo.readSessionSrpeRows(context, { from: date, to: date });
  expect(srpe.map((row) => row.effortRpe)).toEqual([7, 8, 6]);
});
