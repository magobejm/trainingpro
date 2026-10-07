import type { SessionSrpeRow, SrpeWeeklyPoint } from '../progress.models';
import { toWeekStart } from './week-start';

export function aggregateSrpeWeekly(rows: SessionSrpeRow[]): SrpeWeeklyPoint[] {
  const index = new Map<string, SrpeWeeklyPoint>();
  for (const row of rows) {
    const value = computeSessionSrpe(row.effortRpe, row.durationSeconds);
    if (value === null) continue;
    const weekStart = toWeekStart(row.sessionDate);
    const current = index.get(weekStart) ?? { totalSrpe: 0, weekStart };
    current.totalSrpe += value;
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
