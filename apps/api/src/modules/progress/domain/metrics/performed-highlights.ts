import { brzycki } from './daily-exercise';

export type HighlightInput = {
  exerciseId: string;
  sessionId: string;
  weightKg: number | null;
  reps: number | null;
};

export type ExerciseHighlight = {
  sessionCount: number;
  maxWeightKg: number | null;
  recordE1rm: number | null;
};

/** Sessions, heaviest load and best estimated 1RM for each exercise. */
export function highlightsFromSets(rows: HighlightInput[]): Map<string, ExerciseHighlight> {
  const grouped = new Map<string, { sessions: Set<string>; maxWeightKg: number | null; recordE1rm: number | null }>();
  for (const row of rows) {
    const current = grouped.get(row.exerciseId) ?? { sessions: new Set<string>(), maxWeightKg: null, recordE1rm: null };
    current.sessions.add(row.sessionId);
    if (
      row.weightKg !== null &&
      Number.isFinite(row.weightKg) &&
      (current.maxWeightKg === null || row.weightKg > current.maxWeightKg)
    ) {
      current.maxWeightKg = row.weightKg;
    }
    const estimate = brzycki(row.weightKg, row.reps);
    if (estimate !== null && (current.recordE1rm === null || estimate > current.recordE1rm)) current.recordE1rm = estimate;
    grouped.set(row.exerciseId, current);
  }
  return new Map(
    [...grouped].map(([id, value]) => [
      id,
      { sessionCount: value.sessions.size, maxWeightKg: value.maxWeightKg, recordE1rm: value.recordE1rm },
    ]),
  );
}
