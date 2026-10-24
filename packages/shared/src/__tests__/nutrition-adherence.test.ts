import { countAdherence, type MealLogStatus } from '../client-plan/nutrition-adherence';

describe('countAdherence', () => {
  it('counts done meals against the planned meals and keeps the other statuses apart', () => {
    const summary = countAdherence(4, ['DONE', 'DONE', 'CHANGED', 'SKIPPED'] as MealLogStatus[]);
    expect(summary).toEqual({ changed: 1, done: 2, expected: 4, percent: 75, skipped: 1 });
  });

  it('has no percent when nothing was planned', () => {
    expect(countAdherence(0, []).percent).toBeNull();
  });
});
