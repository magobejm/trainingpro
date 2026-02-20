import type { SessionSrpeRow, SrpeWeeklyPoint } from '../progress.models';
import { toWeekStart } from './week-start';

export function aggregateSrpeWeekly(rows: SessionSrpeRow[]): SrpeWeeklyPoint[] {
  const index = new Map<string, SrpeWeeklyPoint>();
  for (const row of rows) {
    const weekStart = toWeekStart(row.sessionDate);
    const current = index.get(weekStart) ?? { totalSrpe: 0, weekStart };
    current.totalSrpe += computeSessionSrpe(row.effortRpe, row.durationSeconds);
    index.set(weekStart, current);
  }
  return [...index.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function computeSessionSrpe(
  effortRpe: null | number,
  durationSeconds: null | number,
): number {
  if (effortRpe === null || durationSeconds === null) {
    return 0;
  }
  if (durationSeconds <= 0 || effortRpe <= 0) {
    return 0;
  }
  const durationMinutes = durationSeconds / 60;
  return Math.round(effortRpe * durationMinutes * 100) / 100;
}
