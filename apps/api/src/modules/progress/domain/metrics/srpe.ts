import type { SessionSrpeRow, SrpeWeeklyPoint } from '../progress.models';
import { toWeekStart } from './week-start';

export function aggregateSrpeWeekly(rows: SessionSrpeRow[]): SrpeWeeklyPoint[] {
  const index = new Map<string, SrpeWeeklyPoint>();
  for (const row of rows) {
    const value = computeSessionSrpe(row.effortRpe, row.durationSeconds);
    const weekStart = toWeekStart(row.sessionDate);
    const current = index.get(weekStart) ?? {
      totalSrpe: null,
      weekStart,
      metricCoverage: { totalSrpe: { validSamples: 0, eligibleSamples: 0, unit: 'sessions' as const } },
    };
    current.metricCoverage!.totalSrpe!.eligibleSamples++;
    if (value !== null) {
      current.totalSrpe = (current.totalSrpe ?? 0) + value;
      current.metricCoverage!.totalSrpe!.validSamples++;
    }
    index.set(weekStart, current);
  }
  return [...index.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function computeSessionSrpe(effortRpe: null | number, durationSeconds: null | number): number | null {
  if (effortRpe === null || durationSeconds === null) {
    return null;
  }
  if (durationSeconds <= 0 || effortRpe <= 0) {
    return null;
  }
  const durationMinutes = durationSeconds / 60;
  return Math.round(effortRpe * durationMinutes * 100) / 100;
}
