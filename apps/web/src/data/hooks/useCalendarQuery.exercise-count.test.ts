import { describe, expect, it } from 'vitest';
import { countRoutineDayExercises } from './useCalendarQuery';

describe('countRoutineDayExercises', () => {
  it('counts strength and the other block types together', () => {
    expect(
      countRoutineDayExercises({
        exercises: [{ id: 'press' }],
        cardioBlocks: [{ id: 'run' }, { id: 'bike' }],
        plioBlocks: [{ id: 'jump' }],
        mobilityBlocks: [{ id: 'hip' }],
        sportBlocks: [{ id: 'sprint' }],
        isometricBlocks: [{ id: 'plank' }],
      }),
    ).toBe(7);
  });

  it('counts a strength-only day by its exercises', () => {
    expect(countRoutineDayExercises({ exercises: [{ id: 'row' }] })).toBe(1);
  });

  it('treats a day without blocks as empty', () => {
    expect(countRoutineDayExercises({})).toBe(0);
  });
});
