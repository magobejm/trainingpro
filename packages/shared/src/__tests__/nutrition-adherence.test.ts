import { countAdherence, expectedMealsOnDate, type MealLogStatus } from '../client-plan/nutrition-adherence';

describe('countAdherence', () => {
  it('counts done meals against the planned meals and keeps the other statuses apart', () => {
    const summary = countAdherence(4, ['DONE', 'DONE', 'CHANGED', 'SKIPPED'] as MealLogStatus[]);
    expect(summary).toEqual({ changed: 1, done: 2, expected: 4, percent: 75, skipped: 1 });
  });

  it('has no percent when nothing was planned', () => {
    expect(countAdherence(0, []).percent).toBeNull();
  });

  it('does not count meals on days before the plan was assigned', () => {
    const assigned = new Date(2026, 9, 23, 9, 0, 0);
    expect(expectedMealsOnDate(assigned, '2026-10-22', 4)).toBe(0);
    expect(expectedMealsOnDate(assigned, '2026-10-23', 4)).toBe(4);
  });
});
