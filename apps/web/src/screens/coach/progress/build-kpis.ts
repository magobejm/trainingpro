import type { ExerciseProgressPoint } from '../../../data/hooks/useExerciseProgressQuery';
import type { MicrocycleProgressPoint } from '../../../data/hooks/useMicrocycleProgressQuery';
import type { SessionProgressPoint } from '../../../data/hooks/useSessionProgressQuery';
import type { AnalysisMode, DateRange } from './progress-screen.types';
function daysBetweenInclusive(from: string, to: string): number {
  const t0 = new Date(`${from}T00:00:00.000Z`).getTime();
  const t1 = new Date(`${to}T00:00:00.000Z`).getTime();
  if (Number.isNaN(t0) || Number.isNaN(t1) || t1 < t0) return 0;
  return Math.floor((t1 - t0) / 86400000) + 1;
}

function formatMetric(value: number | null, decimals = 1): string {
  if (value === null || Number.isNaN(value)) return '—';
  const n = Math.pow(10, decimals);
  return `${Math.round(value * n) / n}`;
}

export function buildKpis(input: {
  mode: AnalysisMode;
  points: Record<string, unknown>[];
  range: DateRange;
  exercisePr: number | null;
  cycleDays: number | null;
  planDaysCount: number;
}) {
  if (input.points.length === 0) return [];
  if (input.mode === 'exercise') {
    const exercisePoints = input.points as ExerciseProgressPoint[];
    const maxE1rm = Math.max(...exercisePoints.map((p) => p.e1rm ?? 0));
    const totalDays = Math.max(1, daysBetweenInclusive(input.range.from, input.range.to));
    const weeklyFrequency = exercisePoints.length / (totalDays / 7);
    return [
      { id: 'e1rm', label: 'coach.progress.kpi.e1rm', value: `${Math.round(maxE1rm)} kg` },
      { id: 'weeklyFrequency', label: 'coach.progress.kpi.weeklyFrequency', value: formatMetric(weeklyFrequency, 2) },
      {
        id: 'historicPr',
        label: 'coach.progress.kpi.historicPr',
        value: input.exercisePr !== null ? `${Math.round(input.exercisePr)} kg` : '—',
      },
    ];
  }
  if (input.mode === 'session') {
    const sessionPoints = input.points as SessionProgressPoint[];
    const withDuration = sessionPoints.filter((p) => p.durationMinutes !== null);
    const avgDuration =
      withDuration.length > 0 ? withDuration.reduce((s, p) => s + (p.durationMinutes ?? 0), 0) / withDuration.length : null;
    const withIntensity = sessionPoints.filter((p) => p.avgIntensityPercent !== null);
    const avgIntensity =
      withIntensity.length > 0
        ? withIntensity.reduce((s, p) => s + (p.avgIntensityPercent ?? 0), 0) / withIntensity.length
        : null;
    const peakLoad = Math.max(...sessionPoints.map((p) => p.peakLoadKg ?? 0));
    return [
      {
        id: 'avgSessionTime',
        label: 'coach.progress.kpi.avgSessionTime',
        value: avgDuration !== null ? `${Math.round(avgDuration)} min` : '—',
      },
      {
        id: 'avgIntensity',
        label: 'coach.progress.kpi.avgIntensity',
        value: avgIntensity !== null ? `${formatMetric(avgIntensity, 1)}%` : '—',
      },
      { id: 'peakLoad', label: 'coach.progress.kpi.peakLoad', value: `${Math.round(peakLoad)} kg` },
    ];
  }

  const microPoints = input.points as MicrocycleProgressPoint[];
  const totalSessions = microPoints.reduce((s, p) => s + p.sessionsCount, 0);
  const cycleDays = Math.max(1, input.cycleDays ?? 7);
  const totalRangeDays = Math.max(1, daysBetweenInclusive(input.range.from, input.range.to));
  const cyclesInRange = Math.floor(totalRangeDays / cycleDays);
  const expectedSessions = input.planDaysCount > 0 ? input.planDaysCount * cyclesInRange : 0;
  const adherence = expectedSessions > 0 ? (totalSessions / expectedSessions) * 100 : null;
  const firstE1rm = microPoints[0]?.avgE1rm ?? null;
  const lastE1rm = microPoints[microPoints.length - 1]?.avgE1rm ?? null;
  const globalStrengthGain =
    firstE1rm !== null && firstE1rm > 0 && lastE1rm !== null ? ((lastE1rm - firstE1rm) / firstE1rm) * 100 : null;
  const recordsBroken = microPoints.reduce((s, p) => s + (p.recordsBroken ?? 0), 0);
  return [
    {
      id: 'adherence',
      label: 'coach.progress.kpi.adherence',
      value: adherence !== null ? `${formatMetric(adherence, 1)}%` : '—',
    },
    {
      id: 'globalStrengthGain',
      label: 'coach.progress.kpi.globalStrengthGain',
      value: globalStrengthGain !== null ? `${formatMetric(globalStrengthGain, 1)}%` : '—',
    },
    { id: 'recordsBroken', label: 'coach.progress.kpi.recordsBroken', value: `${recordsBroken}` },
  ];
}
