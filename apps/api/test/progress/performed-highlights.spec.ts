import { highlightsFromSets } from '../../src/modules/progress/domain/metrics/performed-highlights';

describe('highlightsFromSets', () => {
  it('counts sessions once and keeps the heaviest load and the best estimate', () => {
    const result = highlightsFromSets([
      { exerciseId: 'squat', sessionId: 'a', weightKg: 90, reps: 8 },
      { exerciseId: 'squat', sessionId: 'a', weightKg: 100, reps: 1 },
      { exerciseId: 'squat', sessionId: 'b', weightKg: null, reps: null },
    ]);
    const squat = result.get('squat');
    expect(squat?.sessionCount).toBe(2);
    expect(squat?.maxWeightKg).toBe(100);
    expect(squat?.recordE1rm).toBeGreaterThan(100);
  });

  it('leaves weight empty when the session has no load', () => {
    const result = highlightsFromSets([{ exerciseId: 'run', sessionId: 'a', weightKg: null, reps: null }]);
    expect(result.get('run')).toEqual({ sessionCount: 1, maxWeightKg: null, recordE1rm: null });
  });
});
