import type { ProgressAuditSet, ProgressDailyPoint, ProgressExerciseType } from '@trainerpro/shared';

export type DailyRawSet = Omit<ProgressAuditSet, 'tonnage' | 'inol'> & {
  activeVariables?: string[];
  headerOnly?: boolean;
  metricDistanceMeters?: number | null;
};
export const sumPresent = (values: (number | null)[]): number | null => {
  const present = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return present.length ? present.reduce((sum, value) => sum + value, 0) : null;
};
export const meanPresent = (values: (number | null)[]): number | null => {
  const present = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return present.length ? present.reduce((sum, value) => sum + value, 0) / present.length : null;
};
export const maxPresent = (values: (number | null)[]): number | null => {
  const present = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return present.length ? Math.max(...present) : null;
};
export function brzycki(weight: number | null, reps: number | null): number | null {
  if (weight === null || reps === null || weight <= 0 || reps <= 0) return null;
  const denominator = 1.0278 - 0.0278 * reps;
  return denominator > 0 ? weight / denominator : null;
}
function activeSportRow(original: DailyRawSet, type: ProgressExerciseType): DailyRawSet {
  const row = { ...original };
  if (type !== 'sport' || !row.activeVariables) return row;
  for (const field of [
    'reps',
    'weightKg',
    'rpe',
    'rir',
    'durationSeconds',
    'distanceMeters',
    'heartRate',
    'fcMaxPercent',
    'fcReservePercent',
    'restSeconds',
    'rom',
  ] as const) {
    if (!row.activeVariables.includes(field)) row[field] = null;
  }
  return row;
}
export function aggregateDailyExercise(type: ProgressExerciseType, rows: DailyRawSet[]): ProgressDailyPoint[] {
  const days = new Map<string, DailyRawSet[]>();
  const originals = new Map<DailyRawSet, DailyRawSet>();
  for (const original of rows) {
    const row = activeSportRow(original, type);
    if (original.metricDistanceMeters !== undefined) row.distanceMeters = original.metricDistanceMeters;
    if (
      ![
        row.reps,
        row.weightKg,
        row.rpe,
        row.rir,
        row.durationSeconds,
        row.distanceMeters,
        row.heartRate,
        row.fcMaxPercent,
        row.fcReservePercent,
        row.rom,
      ].some((value) => value !== null)
    )
      continue;
    days.set(row.sessionDate, [...(days.get(row.sessionDate) ?? []), row]);
    originals.set(row, original);
  }
  return [...days]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sets]) => {
      const reference =
        type === 'strength'
          ? [...sets]
              .filter((row) => brzycki(row.weightKg, row.reps) !== null)
              .sort((a, b) => b.weightKg! - a.weightKg! || brzycki(b.weightKg, b.reps)! - brzycki(a.weightKg, a.reps)!)[0]
          : undefined;
      const e1rm = reference ? brzycki(reference.weightKg, reference.reps) : null;
      const audit = sets
        .filter((set) => !set.headerOnly)
        .map((set): ProgressAuditSet => {
          const volume = type === 'isometric' ? set.durationSeconds : set.reps;
          const tonnage =
            ['strength', 'plio', 'isometric', 'sport'].includes(type) && volume !== null
              ? (set.weightKg ?? (type === 'plio' || type === 'isometric' ? 0 : null))
              : null;
          const denominator = e1rm !== null && set.weightKg !== null ? 100 - (set.weightKg / e1rm) * 100 : 0;
          const raw = { ...(originals.get(set) ?? set) };
          delete raw.activeVariables;
          delete raw.headerOnly;
          delete raw.metricDistanceMeters;
          return {
            ...raw,
            tonnage: tonnage === null || volume === null ? null : tonnage * volume,
            inol: denominator > 0 && set.reps !== null && set.reps > 0 ? set.reps / denominator : null,
          };
        });
      const totalDurationSeconds = sumPresent(sets.map((row) => row.durationSeconds));
      const distanceMeters = sumPresent(sets.map((row) => row.distanceMeters));
      const avgHeartRate = meanPresent(sets.map((row) => row.heartRate));
      const avgRpe = meanPresent(sets.map((row) => row.rpe));
      const inol = sumPresent(audit.map((row) => row.inol));
      const totalReps = sumPresent(sets.map((row) => row.reps));
      return {
        date,
        distanceHeaders: sets.flatMap((set) => {
          const original = originals.get(set);
          return original?.metricDistanceMeters != null
            ? [{ sessionId: original.sessionId, distanceMeters: original.metricDistanceMeters }]
            : [];
        }),
        sessionCount: new Set(sets.map((row) => row.sessionId)).size,
        sets: sets.filter((set) => !set.headerOnly).length,
        totalReps,
        tonnage: sumPresent(audit.map((row) => row.tonnage)),
        avgRpe,
        e1rm,
        inol,
        maxWeightKg: ['strength', 'plio', 'isometric', 'sport'].includes(type)
          ? maxPresent(sets.map((row) => row.weightKg))
          : null,
        totalDurationSeconds,
        distanceMeters,
        avgHeartRate,
        avgPaceMinKm:
          distanceMeters !== null && distanceMeters > 0 && totalDurationSeconds !== null
            ? totalDurationSeconds / 60 / (distanceMeters / 1000)
            : null,
        fcMaxPercent: meanPresent(sets.map((row) => row.fcMaxPercent)),
        fcReservePercent: meanPresent(sets.map((row) => row.fcReservePercent)),
        effortIndex: inol !== null && avgRpe !== null && avgRpe > 0 ? inol / avgRpe : null,
        efficiency:
          totalDurationSeconds !== null && avgHeartRate !== null && avgHeartRate > 0
            ? (totalDurationSeconds / 60 / avgHeartRate) * 100
            : null,
        plioEffort: type === 'plio' && totalReps !== null && avgRpe !== null ? totalReps * avgRpe : null,
        audit,
      };
    });
}
