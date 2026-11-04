import type { ProgressDailyPoint, ProgressExerciseType } from '../http/progress-dashboard';

export type DashboardColorKey =
  | 'chartPink'
  | 'chartPurple'
  | 'chartTeal'
  | 'danger'
  | 'info'
  | 'primary'
  | 'success'
  | 'warning';

export type DashboardMetricDef = { key: string; unit: string; colorKey: DashboardColorKey; divisor?: number };

const metric = (key: string, unit: string, colorKey: DashboardColorKey, divisor?: number): DashboardMetricDef => ({
  key,
  unit,
  colorKey,
  divisor,
});

const tonnage = metric('tonnage', 'kg', 'chartPurple');
const rpe = metric('avgRpe', '', 'danger');
export const routineMetricDefs: DashboardMetricDef[] = [tonnage, rpe, metric('trainingLoad', 'u.a.', 'primary')];
const sets = metric('sets', '', 'success');
const reps = metric('totalReps', '', 'info');
const time = metric('totalDurationSeconds', 'min', 'primary', 60);
const cardio = [
  sets,
  time,
  metric('avgHeartRate', 'ppm', 'chartPink'),
  rpe,
  metric('avgPaceMinKm', 'min/km', 'chartTeal'),
  metric('fcReservePercent', '%', 'warning'),
];
const strength = [sets, reps, tonnage, rpe, metric('inol', '', 'warning'), metric('e1rm', 'kg', 'primary')];

export function exerciseMetricDefs(type: ProgressExerciseType, points: ProgressDailyPoint[]): DashboardMetricDef[] {
  if (type === 'strength') return strength;
  if (type === 'cardio') return cardio;
  if (type === 'plio') return [sets, reps, tonnage, rpe];
  if (type === 'isometric') return [sets, { ...time, unit: 's', divisor: 1 }, tonnage, rpe];
  if (type === 'mobility') return [sets, reps, rpe];
  const available = [
    ...strength,
    time,
    ...cardio.filter((m) => !['sets', 'totalDurationSeconds', 'avgRpe'].includes(m.key)),
    metric('distanceMeters', 'km', 'info', 1000),
  ];
  return available.filter((m) => m.key === 'sets' || points.some((p) => p[m.key as keyof ProgressDailyPoint] != null));
}
