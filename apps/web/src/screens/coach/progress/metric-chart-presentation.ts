import type { SessionOutcome } from '@trainerpro/shared';
export type MetricChartPoint = { date: string; value: number | null; sessionDate?: string; outcome?: SessionOutcome };
const outcomes: SessionOutcome[] = ['done', 'incomplete', 'skipped', 'pending', 'in_progress'];
function readOutcome(value: unknown): SessionOutcome | undefined {
  return typeof value === 'string' && outcomes.includes(value as SessionOutcome) ? (value as SessionOutcome) : undefined;
}
export function buildMetricChartData(data: Record<string, unknown>[], xKey: string, valueKey: string): MetricChartPoint[] {
  return data.map((point) => {
    const date = String(point[xKey] ?? '').slice(0, 10);
    const value = point[valueKey];
    return {
      date,
      value: typeof value === 'number' && Number.isFinite(value) ? value : null,
      ...(xKey === 'sessionDate' ? { sessionDate: date, outcome: readOutcome(point.outcome) } : {}),
    };
  });
}
export function metricTooltipTitle(
  label: unknown,
  payload: ReadonlyArray<{ payload?: unknown }>,
  t: (key: string) => string,
): string {
  const candidate = payload[0]?.payload;
  const point = candidate != null && typeof candidate === 'object' ? (candidate as Partial<MetricChartPoint>) : undefined;
  const date = point?.sessionDate ?? point?.date ?? String(label ?? '');
  const outcome = point?.sessionDate ? readOutcome(point.outcome) : undefined;
  return date + (outcome ? ' · ' + t('training.outcome.' + outcome) : '');
}
