import type { ProgressExerciseRef } from '@trainerpro/shared';
import { filterExercises, isValidDateInput, pickCurrentRoutine } from '../exercise-filter';

const list: ProgressExerciseRef[] = [
  { exerciseId: '1', exerciseType: 'strength', name: 'Sentadilla trasera' },
  { exerciseId: '2', exerciseType: 'cardio', name: 'Carrera continua' },
  { exerciseId: '3', exerciseType: 'strength', name: 'Press de banca' },
];

describe('filterExercises', () => {
  it('filters by text ignoring accents and case', () => {
    expect(filterExercises(list, 'SENTADILLA', 'all').map((e) => e.exerciseId)).toEqual(['1']);
    expect(filterExercises(list, 'carrera', 'all').map((e) => e.exerciseId)).toEqual(['2']);
  });

  it('filters by category', () => {
    expect(filterExercises(list, '', 'strength').map((e) => e.exerciseId)).toEqual(['1', '3']);
  });

  it('combines text and category', () => {
    expect(filterExercises(list, 'press', 'cardio')).toEqual([]);
  });
});

describe('pickCurrentRoutine', () => {
  it('returns the active routine', () => {
    const routines = [
      { active: false, from: '2026-01-01', id: 'a' },
      { active: true, from: '2026-05-01', id: 'b' },
    ];
    expect(pickCurrentRoutine(routines)?.id).toBe('b');
  });

  it('returns null when none is active', () => {
    expect(pickCurrentRoutine([{ active: false, from: '2026-01-01' }])).toBeNull();
  });
});

describe('isValidDateInput', () => {
  it('accepts ISO dates only', () => {
    expect(isValidDateInput('2026-10-05')).toBe(true);
    expect(isValidDateInput('05/10/2026')).toBe(false);
    expect(isValidDateInput('2026-13-40')).toBe(false);
  });
});
