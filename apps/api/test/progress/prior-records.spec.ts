import { bestE1rmByExercise } from '../../src/modules/progress/domain/prior-records';

describe('prior records', () => {
  test('keeps the best estimated one-rep max per exercise', () => {
    const best = bestE1rmByExercise([
      { effortRpe: 10, exerciseId: 'squat', repsDone: 1, weightDoneKg: 100 },
      { effortRpe: 10, exerciseId: 'squat', repsDone: 10, weightDoneKg: 80 },
      { effortRpe: null, exerciseId: null, repsDone: 5, weightDoneKg: 200 },
      { effortRpe: 10, exerciseId: 'row', repsDone: null, weightDoneKg: 40 },
    ]);
    expect(best.get('squat')).toBeGreaterThan(100);
    expect(best.has('row')).toBe(false);
    expect(best.size).toBe(1);
  });
});
