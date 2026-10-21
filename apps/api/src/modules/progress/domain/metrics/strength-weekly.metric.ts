import type { StrengthLogRow, StrengthWeeklyPoint } from '../progress.models';
import { toWeekStart } from './week-start';

export function aggregateStrengthWeekly(rows: StrengthLogRow[]): StrengthWeeklyPoint[] {
  const index = new Map<string, StrengthWeeklyPoint>();
  for (const row of rows) {
    const weekStart = toWeekStart(row.sessionDate);
    const key = `${weekStart}:${row.muscleGroup}`;
    const current = index.get(key) ?? {
      maxWeightKg: null,
      muscleGroup: row.muscleGroup,
      totalReps: null,
      totalSets: 0,
      volumeKg: null,
      weekStart,
    };
    if (row.repsDone !== null || row.weightDoneKg !== null) {
      current.totalSets += 1;
    }
    if (row.repsDone !== null) {
      current.totalReps = (current.totalReps ?? 0) + row.repsDone;
    }
    if (row.weightDoneKg !== null) {
      current.maxWeightKg = Math.max(current.maxWeightKg ?? 0, row.weightDoneKg);
    }
    if (row.repsDone !== null && row.weightDoneKg !== null) {
      current.volumeKg = (current.volumeKg ?? 0) + row.repsDone * row.weightDoneKg;
    }
    const coverage = current.metricCoverage ?? {
      volumeKg: { validSamples: 0, eligibleSamples: 0, unit: 'sets' as const },
      totalReps: { validSamples: 0, eligibleSamples: 0, unit: 'sets' as const },
    };
    coverage.volumeKg!.eligibleSamples++;
    coverage.totalReps!.eligibleSamples++;
    if (row.repsDone !== null && row.weightDoneKg !== null) coverage.volumeKg!.validSamples++;
    if (row.repsDone !== null) coverage.totalReps!.validSamples++;
    current.metricCoverage = coverage;
    index.set(key, current);
  }
  return [...index.values()].sort(sortStrength);
}

function sortStrength(a: StrengthWeeklyPoint, b: StrengthWeeklyPoint): number {
  if (a.weekStart !== b.weekStart) {
    return a.weekStart.localeCompare(b.weekStart);
  }
  return a.muscleGroup.localeCompare(b.muscleGroup);
}
