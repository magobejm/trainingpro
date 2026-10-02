import type { ClientRoutineExercise } from '../../../data/hooks/useClientRoutineQuery';
import { formatExerciseRepRange, routineSetColumnsForType } from '../routine-exercise-set.utils';

function exercise(
  type: ClientRoutineExercise['type'],
  reps: { repsMax?: null | number; repsMin?: null | number } = {},
): ClientRoutineExercise {
  return {
    coachInstructions: null,
    displayName: 'Ejercicio',
    groupId: null,
    groupType: null,
    id: 'ex-1',
    lockedFields: [],
    mediaUrl: null,
    notes: null,
    repsMax: reps.repsMax ?? null,
    repsMin: reps.repsMin ?? null,
    restSeconds: null,
    sets: [],
    setsPlanned: 3,
    sortOrder: 0,
    targetRir: null,
    targetRpe: null,
    type,
    youtubeUrl: null,
  };
}

describe('routineSetColumnsForType', () => {
  it('orders routine table columns by the shared priority', () => {
    expect(routineSetColumnsForType('strength').map((column) => column.key)).toEqual([
      'reps',
      'weightKg',
      'rpe',
      'rir',
      'restSeconds',
    ]);
    expect(routineSetColumnsForType('cardio').map((column) => column.key)).toEqual([
      'rpe',
      'fcMaxPct',
      'durationSeconds',
      'heartRate',
      'fcReservePct',
      'restSeconds',
    ]);
    expect(routineSetColumnsForType('isometric').map((column) => column.key)).toEqual([
      'weightKg',
      'rpe',
      'durationSeconds',
      'restSeconds',
    ]);
    expect(routineSetColumnsForType('plio').map((column) => column.key)).toEqual([
      'reps',
      'weightKg',
      'rpe',
      'durationSeconds',
      'restSeconds',
    ]);
    expect(routineSetColumnsForType('mobility').map((column) => column.key)).toEqual([
      'reps',
      'weightKg',
      'rpe',
      'rom',
      'restSeconds',
    ]);
  });

  it('shows six default sport columns when extra variables stay locked', () => {
    expect(routineSetColumnsForType('sport', []).map((column) => column.key)).toEqual([
      'reps',
      'weightKg',
      'rpe',
      'fcMaxPct',
      'durationSeconds',
      'restSeconds',
    ]);
  });
});

describe('formatExerciseRepRange', () => {
  it.each(['strength', 'plio', 'mobility', 'sport'] as const)('keeps the rep range for %s', (type) => {
    expect(formatExerciseRepRange(exercise(type, { repsMin: 6, repsMax: 12 }))).toBe('6-12');
  });

  it.each(['cardio', 'isometric'] as const)('hides the rep range for %s even when min/max exist', (type) => {
    expect(formatExerciseRepRange(exercise(type, { repsMin: 6, repsMax: 12 }))).toBeNull();
  });

  it('formats a single bound for strength-like types', () => {
    expect(formatExerciseRepRange(exercise('plio', { repsMin: 8 }))).toBe('8');
    expect(formatExerciseRepRange(exercise('mobility', { repsMax: 10 }))).toBe('10');
  });
});
