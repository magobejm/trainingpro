import { aggregateCardioWeekly } from '../../src/modules/progress/domain/metrics/cardio-weekly.metric';
import { aggregateExerciseSets } from '../../src/modules/progress/domain/metrics/exercise-metrics';
import { aggregateSrpeWeekly } from '../../src/modules/progress/domain/metrics/srpe';

describe('empty set metrics', () => {
  test('leaves an empty cardio row out of the weekly totals', () => {
    expect(
      aggregateCardioWeekly([
        {
          avgHeartRate: null,
          distanceDoneMeters: null,
          durationSecondsDone: null,
          effortRpe: null,
          methodType: 'HIIT',
          sessionDate: new Date('2026-02-17T10:00:00.000Z'),
        },
      ]),
    ).toEqual([]);
  });

  test('counts only sets that have data and ignores a null rpe in the average', () => {
    const result = aggregateExerciseSets('session-1', new Date('2026-10-07T10:00:00.000Z'), [
      { effortRpe: 8, repsDone: 8, setIndex: 1, weightDoneKg: 60 },
      { effortRpe: null, repsDone: 8, setIndex: 2, weightDoneKg: 60 },
      { effortRpe: null, repsDone: null, setIndex: 3, weightDoneKg: null },
    ]);

    expect(result.sets).toBe(2);
    expect(result.totalReps).toBe(16);
    expect(result.tonnage).toBe(960);
    expect(result.avgRpe).toBe(8);
    expect(result.setDetails).toHaveLength(2);
  });

  test('does not add a zero when a session has no rpe or duration', () => {
    const sessionDate = new Date('2026-10-07T10:00:00.000Z');
    expect(
      aggregateSrpeWeekly([
        { durationSeconds: 1800, effortRpe: null, sessionDate },
        { durationSeconds: null, effortRpe: 8, sessionDate },
      ]),
    ).toEqual([]);
    expect(
      aggregateSrpeWeekly([
        { durationSeconds: 1800, effortRpe: 8, sessionDate },
        { durationSeconds: 1800, effortRpe: null, sessionDate },
      ]),
    ).toEqual([{ totalSrpe: 240, weekStart: '2026-10-05' }]);
  });
});
