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

it('exports canonical outcomes, real adherence cutoff and coverage without fabricated samples', () => {
  const doc = progressDocument({
    t: (key) => key,
    clientName: 'Client',
    range: { from: '2026-10-01', to: '2026-10-20' },
    mode: 'session',
    selection: [],
    points: [
      {
        sessionDate: '2026-10-19',
        sessionTonnage: null,
        metricCoverage: { sessionTonnage: { validSamples: 0, eligibleSamples: 3, unit: 'sets' } },
      },
    ],
    variables: [{ id: 'tonnage', labelKey: 'tonnage', dataKey: 'sessionTonnage', unit: 'kg', color: 'red' }],
    kpis: [],
    insights: [],
    recordsRange: { from: '2026-10-01', to: '2026-10-20' },
    heatmapRange: { from: '2026-10-01', to: '2026-10-20' },
    heatmap: { bestStreak: 0, currentStreak: 0, trainedDays: 0, weeks: [] },
    sessions: [
      {
        sessionDate: '2026-10-19',
        sessionId: 's',
        outcome: 'incomplete',
        originDate: '2026-10-18',
        totalTonnage: null,
        exerciseCount: 1,
        sessionInol: null,
        avgRpe: null,
        durationMinutes: null,
      },
      {
        sessionDate: '2026-10-18',
        sessionId: 'skipped',
        outcome: 'skipped',
        skipReason: 'Viaje familiar · sin gimnasio',
        totalTonnage: null,
        exerciseCount: 0,
        sessionInol: null,
        avgRpe: null,
        durationMinutes: null,
      },
    ],
    adherence: {
      from: '2026-10-01',
      to: '2026-10-20',
      cutoffDate: '2026-10-19',
      percent: 0,
      plannedCount: 1,
      counts: { done: 0, incomplete: 1, skipped: 0, pending: 0, in_progress: 0 },
      unplannedSessionsCount: 0,
    },
  });
  expect(doc.sections.find((s) => s.heading === 'training.sessions')?.table?.rows).toEqual([
    ['2026-10-19', 'training.outcome.incomplete', '2026-10-18'],
    ['2026-10-18', 'training.outcome.skipped · Viaje familiar · sin gimnasio', '—'],
  ]);
  expect(doc.sections.find((s) => s.heading === 'tonnage')?.table?.rows[0]?.[1]).toBe('—');
  expect(JSON.stringify(doc)).toContain('training.adherence.formula');
  expect(JSON.stringify(doc)).toContain('training.coverage');
});
