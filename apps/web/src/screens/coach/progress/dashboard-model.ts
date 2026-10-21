import type { ProgressExerciseDaily, ProgressRoutineCycle } from '@trainerpro/shared';
import type { DateRange } from './progress-screen.types';

export type DashboardPoint = Record<string, unknown> & { date: string; label?: string; cycleIndex?: number };
const dayMs = 86_400_000;
const iso = (value: number) => new Date(value).toISOString().slice(0, 10);

export function dateChunks(range: DateRange): DateRange[] {
  const end = Date.parse(`${range.to}T00:00:00Z`);
  const result: DateRange[] = [];
  for (let start = Date.parse(`${range.from}T00:00:00Z`); start <= end; start += 400 * dayMs) {
    result.push({ from: iso(start), to: iso(Math.min(start + 399 * dayMs, end)) });
  }
  return result;
}

function maximum(values: Array<number | null>): number | null {
  const recorded = values.filter((v): v is number => v !== null && Number.isFinite(v));
  return recorded.length ? Math.max(...recorded) : null;
}

export function mergeDailyResults(results: ProgressExerciseDaily[]): ProgressExerciseDaily | null {
  if (!results.length) return null;
  const points = results.flatMap((result) => result.points).sort((a, b) => a.date.localeCompare(b.date));
  return {
    exercise: results[0]!.exercise,
    from: results.map((r) => r.from).sort()[0]!,
    to: results
      .map((r) => r.to)
      .sort()
      .at(-1)!,
    points,
    kpis: {
      sessionCount: results.reduce((sum, r) => sum + r.kpis.sessionCount, 0),
      recordE1rm: maximum(results.map((r) => r.kpis.recordE1rm)),
      maxWeightKg: maximum(results.map((r) => r.kpis.maxWeightKg)),
    },
  };
}

export function cycleChartPoints(cycles: ProgressRoutineCycle[], indices: number[], compare: boolean): DashboardPoint[] {
  const selected = cycles.filter((cycle) => indices.includes(cycle.index)).sort((a, b) => a.index - b.index);
  if (compare)
    return selected.map((cycle) => ({
      date: cycle.from,
      cycleIndex: cycle.index,
      tonnage: cycle.tonnage,
      avgRpe: cycle.avgRpe,
      trainingLoad: cycle.trainingLoad,
    }));
  return selected
    .flatMap((cycle) =>
      cycle.sessions.map((session) => ({
        date: session.date,
        label: session.title,
        sessionId: session.id,
        tonnage: session.tonnage,
        avgRpe: session.rpe,
        trainingLoad: session.trainingLoad,
        incomplete: session.incomplete,
      })),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function selectedAdherence(cycles: ProgressRoutineCycle[], indices: number[]) {
  const selected = cycles.filter((c) => indices.includes(c.index));
  const done = selected.reduce((sum, c) => sum + c.adherence.done, 0);
  const planned = selected.reduce((sum, c) => sum + c.adherence.planned, 0);
  return { done, planned, percent: planned ? (done / planned) * 100 : null };
}

export function metricSummary(points: Record<string, unknown>[], key: string) {
  const values = points.map((p) => p[key]).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (!values.length) return { average: null, max: null, min: null, total: null };
  const total = values.reduce((sum, v) => sum + v, 0);
  return { average: total / values.length, max: Math.max(...values), min: Math.min(...values), total };
}

export function defaultRange(days = 365): DateRange {
  const today = new Date();
  const to = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return { from: iso(Date.parse(`${to}T00:00:00Z`) - (days - 1) * dayMs), to };
}

export function inferRangePreset(range: DateRange, today: string, historyFrom?: string | null): string {
  if (range.to !== today) return 'custom';
  if (historyFrom && range.from === historyFrom) return 'all';
  const days = Math.round((Date.parse(range.to) - Date.parse(range.from)) / dayMs) + 1;
  return [30, 90, 365, 730].includes(days) ? String(days) : 'custom';
}

export function formatMetric(value: unknown, unit = ''): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ''}`
    : '—';
}

export function exerciseKpis(
  kpis: ProgressExerciseDaily['kpis'] | undefined,
  type: import('@trainerpro/shared').ProgressExerciseType,
  notApplicable: string,
) {
  return [
    { key: 'validSessions', value: formatMetric(kpis?.sessionCount) },
    {
      key: 'recordE1rm',
      value: type === 'strength' || kpis?.recordE1rm != null ? formatMetric(kpis?.recordE1rm, 'kg') : notApplicable,
    },
    {
      key: 'maxWeightKg',
      value: ['strength', 'plio', 'isometric', 'sport'].includes(type)
        ? formatMetric(kpis?.maxWeightKg, 'kg')
        : notApplicable,
    },
  ];
}
