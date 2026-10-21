import { expect, it } from 'vitest';
import { buildMetricChartData, metricTooltipTitle } from './metric-chart-presentation';
const labels: Record<string, string> = {
  'training.outcome.incomplete': 'Incompleto',
  'training.outcome.done': 'Completado',
};
const t = (key: string) => labels[key] ?? key;
it('retains the canonical full date and translated session result in the tooltip', () => {
  const points = buildMetricChartData(
    [{ sessionDate: '2026-01-01T00:00:00.000Z', outcome: 'incomplete', tonnage: 0 }],
    'sessionDate',
    'tonnage',
  );
  expect(points).toEqual([{ date: '2026-01-01', sessionDate: '2026-01-01', outcome: 'incomplete', value: 0 }]);
  expect(metricTooltipTitle('01-01', [{ payload: points[0] }], t)).toBe('2026-01-01 · Incompleto');
});
it('keeps the year distinct and preserves absent measurements', () => {
  const points = buildMetricChartData(
    [
      { sessionDate: '2025-01-01', outcome: 'done', tonnage: null },
      { sessionDate: '2026-01-01', outcome: 'incomplete' },
    ],
    'sessionDate',
    'tonnage',
  );
  expect(points.map((p) => metricTooltipTitle(p.date, [{ payload: p }], t))).toEqual([
    '2025-01-01 · Completado',
    '2026-01-01 · Incompleto',
  ]);
  expect(points.map((p) => p.value)).toEqual([null, null]);
});
it('does not attribute a single outcome to a microcycle aggregate', () => {
  const points = buildMetricChartData(
    [{ weekStart: '2026-01-01', outcome: 'incomplete', totalTonnage: 25 }],
    'weekStart',
    'totalTonnage',
  );
  expect(points[0]?.outcome).toBeUndefined();
  expect(points[0]?.sessionDate).toBeUndefined();
  expect(metricTooltipTitle(points[0]?.date, [{ payload: points[0] }], t)).toBe('2026-01-01');
});
