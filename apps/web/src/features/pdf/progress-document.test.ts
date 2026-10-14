import { describe, expect, it } from 'vitest';
import { progressDocument } from './progress-document';

describe('progress PDF snapshot', () => {
  it('uses selected variables, exact KPI values and each section own period', () => {
    const points = [
      { sessionDate: '2026-10-01', sets: 4, avgRpe: 8 },
      { sessionDate: '2026-10-02', sets: 6, avgRpe: null },
    ];
    const result = progressDocument({
      t: (key) => key,
      clientName: 'Test client',
      range: { from: '2026-10-01', to: '2026-10-14' },
      mode: 'exercise',
      selection: ['Squat'],
      points,
      variables: [{ id: 'sets', labelKey: 'sets', dataKey: 'sets', color: 'red', unit: '' }],
      kpis: [{ label: 'historical PR', value: '157 kg' }],
      insights: ['Improvement'],
      recordsRange: { from: '2026-10-01', to: '2026-10-14' },
      heatmapRange: { from: '2026-04-20', to: '2026-10-18' },
      heatmap: { bestStreak: 2, currentStreak: 1, trainedDays: 3, weeks: [] },
    });
    expect(result.sections.filter((s) => s.chart)).toHaveLength(1);
    expect(result.sections.find((s) => s.chart)?.chart?.points).toEqual([
      { label: '2026-10-01', value: 4 },
      { label: '2026-10-02', value: 6 },
    ]);
    expect(JSON.stringify(result)).toContain('157 kg');
    expect(JSON.stringify(result)).toContain('2026-04-20');
    points[0]!.sets = 100;
    expect(result.sections.find((s) => s.chart)?.chart?.points[0]?.value).toBe(4);
  });
});
