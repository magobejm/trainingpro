import type { ProgressExerciseRef } from '@trainerpro/shared';

export const EXERCISE_CATEGORIES = ['strength', 'cardio', 'plio', 'isometric', 'mobility', 'sport'] as const;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterExercises<T extends ProgressExerciseRef>(exercises: T[], search: string, category: string): T[] {
  const needle = normalize(search);
  return exercises.filter(
    (exercise) =>
      (!needle || normalize(exercise.name).includes(needle)) && (category === 'all' || exercise.exerciseType === category),
  );
}

/** The routine flagged active in the catalog, if any. */
export function pickCurrentRoutine<T extends { active: boolean; from: string }>(routines: T[]): T | null {
  return routines.find((routine) => routine.active) ?? null;
}

export function isValidDateInput(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
