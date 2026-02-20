import { aggregateCardioWeekly } from '../../src/modules/progress/domain/metrics/cardio-weekly.metric';
import { aggregateStrengthWeekly } from '../../src/modules/progress/domain/metrics/strength-weekly.metric';
import { computeSessionSrpe } from '../../src/modules/progress/domain/metrics/srpe';

describe('progress metrics', () => {
  test('aggregates strength weekly using only done values', () => {
    const result = aggregateStrengthWeekly([
      {
        muscleGroup: 'chest',
        repsDone: 10,
        sessionDate: new Date('2026-02-16T10:00:00.000Z'),
        weightDoneKg: 80,
      },
      {
        muscleGroup: 'chest',
        repsDone: 8,
        sessionDate: new Date('2026-02-17T10:00:00.000Z'),
        weightDoneKg: 82.5,
      },
      {
        muscleGroup: 'chest',
        repsDone: null,
        sessionDate: new Date('2026-02-17T10:00:00.000Z'),
        weightDoneKg: null,
      },
      {
        muscleGroup: 'back',
        repsDone: 12,
        sessionDate: new Date('2026-02-18T10:00:00.000Z'),
        weightDoneKg: 70,
      },
    ]);

    expect(result).toEqual([
      {
        maxWeightKg: 70,
        muscleGroup: 'back',
        totalReps: 12,
        totalSets: 1,
        volumeKg: 840,
        weekStart: '2026-02-16',
      },
      {
        maxWeightKg: 82.5,
        muscleGroup: 'chest',
        totalReps: 18,
        totalSets: 2,
        volumeKg: 1460,
        weekStart: '2026-02-16',
      },
    ]);
  });

  test('aggregates cardio weekly with time distance and averages', () => {
    const result = aggregateCardioWeekly([
      {
        avgHeartRate: 150,
        distanceDoneMeters: 1000,
        durationSecondsDone: 300,
        effortRpe: 7,
        methodType: 'HIIT',
        sessionDate: new Date('2026-02-16T10:00:00.000Z'),
      },
      {
        avgHeartRate: 160,
        distanceDoneMeters: 1200,
        durationSecondsDone: 320,
        effortRpe: 8,
        methodType: 'HIIT',
        sessionDate: new Date('2026-02-17T10:00:00.000Z'),
      },
      {
        avgHeartRate: null,
        distanceDoneMeters: null,
        durationSecondsDone: 900,
        effortRpe: 5,
        methodType: 'CONTINUOUS',
        sessionDate: new Date('2026-02-17T10:00:00.000Z'),
      },
    ]);

    expect(result).toEqual([
      {
        avgHeartRate: null,
        avgRpe: 5,
        methodType: 'CONTINUOUS',
        totalDistanceMeters: 0,
        totalDurationSeconds: 900,
        weekStart: '2026-02-16',
      },
      {
        avgHeartRate: 155,
        avgRpe: 7.5,
        methodType: 'HIIT',
        totalDistanceMeters: 2200,
        totalDurationSeconds: 620,
        weekStart: '2026-02-16',
      },
    ]);
  });

  test('computes srpe from session effort and real duration', () => {
    expect(computeSessionSrpe(8, 1800)).toBe(240);
    expect(computeSessionSrpe(null, 1800)).toBe(0);
    expect(computeSessionSrpe(8, null)).toBe(0);
  });
});
