import { estimateE1rm } from './metrics/exercise-metrics';

export type PriorSet = {
  effortRpe: number | null;
  effortRir?: number | null;
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
  return estimateE1rm(set.weightDoneKg, set.repsDone, set.effortRpe, set.effortRir);
}

export type RecordCandidate = PriorSet & {
  exerciseName: string;
  sessionDate: string;
  sessionId: string;
};

export type BrokenRecord = {
  e1rm: number;
  exerciseId: string;
  exerciseName: string;
  previousBest: number | null;
  sessionDate: string;
  sessionId: string;
};

export function collectBrokenRecords(priorBest: Map<string, number>, logs: RecordCandidate[]): BrokenRecord[] {
  const best = new Map(priorBest);
  const records: BrokenRecord[] = [];
  for (const log of logs) {
    const e1rm = e1rmOf(log);
    if (!log.exerciseId || e1rm === null) continue;
    const previousBest = best.get(log.exerciseId);
    if (previousBest !== undefined && e1rm <= previousBest) continue;
    records.push({
      e1rm,
      exerciseId: log.exerciseId,
      exerciseName: log.exerciseName,
      previousBest: previousBest ?? null,
      sessionDate: log.sessionDate,
      sessionId: log.sessionId,
    });
    best.set(log.exerciseId, e1rm);
  }
  return records;
}
