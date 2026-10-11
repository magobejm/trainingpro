import { estimateE1rm } from './metrics/exercise-metrics';

export type PriorSet = {
  effortRpe: number | null;
  exerciseId: string | null;
  repsDone: number | null;
  weightDoneKg: number | null;
};

export function bestE1rmByExercise(sets: PriorSet[]): Map<string, number> {
  const best = new Map<string, number>();
  for (const set of sets) {
    const e1rm = e1rmOf(set);
    if (!set.exerciseId || e1rm === null) continue;
    const previous = best.get(set.exerciseId);
    if (previous === undefined || e1rm > previous) best.set(set.exerciseId, e1rm);
  }
  return best;
}

function e1rmOf(set: PriorSet): number | null {
  if (set.repsDone === null || set.weightDoneKg === null) return null;
  return estimateE1rm(set.weightDoneKg, set.repsDone, set.effortRpe);
}
