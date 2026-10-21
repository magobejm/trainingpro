import { aggregateDailyExercise } from '../../src/modules/progress/domain/metrics/daily-exercise';

const row = (sessionId: string, weightKg: number | null, reps: number | null, rpe: number | null = null) => ({
  sessionId,
  sessionDate: '2026-10-01',
  sessionTitle: 'Día 1',
  incomplete: false,
  setIndex: 1,
  weightKg,
  reps,
  rpe,
  rir: null,
  durationSeconds: null,
  distanceMeters: null,
  heartRate: null,
  fcMaxPercent: null,
  fcReservePercent: null,
  restSeconds: null,
  rom: null,
});
describe('canonical daily exercise metrics', () => {
  it('merges sessions and uses the heaviest daily series as the Brzycki reference without RPE adjustment', () => {
    const point = aggregateDailyExercise('strength', [row('a', 100, 5, 7), row('b', 80, 12, 9)])[0]!;
    expect(point.sessionCount).toBe(2);
    expect(point.e1rm).toBeCloseTo(100 / (1.0278 - 0.0278 * 5), 2);
    expect(point.avgRpe).toBe(8);
    expect(point.tonnage).toBe(1460);
    expect(point.inol).toBeCloseTo(5 / (100 - (100 / point.e1rm!) * 100) + 12 / (100 - (80 / point.e1rm!) * 100), 3);
    expect(point.audit.map((set) => set.sessionId)).toEqual(['a', 'b']);
  });
  it('keeps missing samples absent and zero external load valid', () => {
    const point = aggregateDailyExercise('plio', [row('a', null, 10), row('b', null, null)])[0]!;
    expect(point.totalReps).toBe(10);
    expect(point.tonnage).toBe(0);
    expect(point.avgRpe).toBeNull();
    expect(point.sessionCount).toBe(1);
  });
  it('uses seconds for isometric tonnage and sums distance and duration before computing cardiovascular metrics', () => {
    const iso = aggregateDailyExercise('isometric', [{ ...row('a', 5, null), durationSeconds: 20 }])[0]!;
    expect(iso.tonnage).toBe(100);
    const cardio = aggregateDailyExercise('cardio', [
      { ...row('a', null, null), durationSeconds: 600, distanceMeters: 2000, heartRate: 120 },
    ])[0]!;
    expect(cardio.avgPaceMinKm).toBe(5);
    expect(cardio.efficiency).toBeCloseTo((10 / 120) * 100);
    expect(cardio.e1rm).toBeNull();
  });
  it('limits sport metrics to its active variables while preserving raw values in the audit', () => {
    const point = aggregateDailyExercise('sport', [
      {
        ...row('a', 50, 12, 8),
        durationSeconds: 600,
        distanceMeters: 2000,
        activeVariables: ['durationSeconds', 'distanceMeters', 'rpe'],
      },
    ])[0]!;
    expect(point.totalReps).toBeNull();
    expect(point.tonnage).toBeNull();
    expect(point.maxWeightKg).toBeNull();
    expect(point.avgPaceMinKm).toBe(5);
    expect(point.audit[0]?.weightKg).toBe(50);
  });
  it('preserves a header distance without counting it as a completed series', () => {
    const point = aggregateDailyExercise('cardio', [
      { ...row('a', null, null), distanceMeters: 5000, headerOnly: true },
    ])[0]!;
    expect(point.sets).toBe(0);
    expect(point.sessionCount).toBe(1);
    expect(point.distanceMeters).toBe(5000);
    expect(point.audit).toEqual([]);
  });
  it('exposes the cardio header used for pace without changing the original series audit', () => {
    const point = aggregateDailyExercise('cardio', [
      { ...row('a', null, null), distanceMeters: 999, metricDistanceMeters: 5000, durationSeconds: 1500 },
    ])[0]!;
    expect(point).toMatchObject({ distanceMeters: 5000, distanceHeaders: [{ sessionId: 'a', distanceMeters: 5000 }] });
    expect(point.audit[0]?.distanceMeters).toBe(999);
    const headerOnly = aggregateDailyExercise('cardio', [
      { ...row('a', null, null), metricDistanceMeters: 5000, headerOnly: true },
    ])[0]!;
    expect(headerOnly).toMatchObject({ sets: 0, distanceHeaders: [{ sessionId: 'a', distanceMeters: 5000 }], audit: [] });
  });
});
