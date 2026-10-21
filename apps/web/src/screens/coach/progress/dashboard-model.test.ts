import { describe, expect, it } from 'vitest';
import {
  dateChunks,
  mergeDailyResults,
  cycleChartPoints,
  selectedAdherence,
  metricSummary,
  exerciseKpis,
  inferRangePreset,
} from './dashboard-model';
import type { ProgressExerciseDaily, ProgressRoutineCycle } from '@trainerpro/shared';

describe('progress dashboard', () => {
  it('preserves the real period label when opening an exercise from custom history', () => {
    expect(inferRangePreset({ from: '2024-01-01', to: '2025-02-15' }, '2026-10-21')).toBe('custom');
    expect(inferRangePreset({ from: '2025-10-22', to: '2026-10-21' }, '2026-10-21')).toBe('365');
    expect(inferRangePreset({ from: '2024-01-01', to: '2026-10-21' }, '2026-10-21', '2024-01-01')).toBe('all');
  });
  it('distinguishes missing strength records from metrics that do not apply to cardio', () => {
    const kpis = { sessionCount: 2, recordE1rm: null, maxWeightKg: null };
    expect(exerciseKpis(kpis, 'strength', 'N/A')[1]?.value).toBe('—');
    expect(exerciseKpis(kpis, 'cardio', 'N/A')[1]?.value).toBe('N/A');
    expect(exerciseKpis(kpis, 'cardio', 'N/A')[2]?.value).toBe('N/A');
  });
  it('loads long history in inclusive chunks without duplicate boundary days', () => {
    const ranges = dateChunks({ from: '2024-01-01', to: '2026-01-01' });
    expect(ranges).toEqual([
      { from: '2024-01-01', to: '2025-02-03' },
      { from: '2025-02-04', to: '2026-01-01' },
    ]);
    expect(dateChunks({ from: '2026-01-02', to: '2026-01-01' })).toEqual([]);
  });
  it('keeps all dates and counts sessions rather than daily points across history chunks', () => {
    const result = (date: string, count: number, record: number): ProgressExerciseDaily => ({
      exercise: { exerciseId: 'exercise', exerciseType: 'strength', name: 'Press' },
      from: date,
      to: date,
      points: [{ date, sessionCount: count, e1rm: record } as ProgressExerciseDaily['points'][number]],
      kpis: { sessionCount: count, recordE1rm: record, maxWeightKg: record - 10 },
    });
    const merged = mergeDailyResults([result('2026-01-02', 2, 100), result('2025-01-01', 1, 80)]);
    expect(merged?.points.map((p) => p.date)).toEqual(['2025-01-01', '2026-01-02']);
    expect(merged?.kpis).toEqual({ sessionCount: 3, recordE1rm: 100, maxWeightKg: 90 });
  });
  it('compares selected cycles only in chronology and sums adherence counts', () => {
    const cycle = (index: number, done: number, planned: number): ProgressRoutineCycle => ({
      index,
      from: `2026-10-${String(index + 1).padStart(2, '0')}`,
      to: '2026-10-30',
      sessions: [],
      tonnage: index * 100,
      avgRpe: 7,
      trainingLoad: index * 10,
      adherence: { done, planned, percent: null },
    });
    const cycles = [cycle(2, 1, 2), cycle(0, 2, 3), cycle(1, 1, 4)];
    expect(cycleChartPoints(cycles, [2, 0], true).map((p) => p.cycleIndex)).toEqual([0, 2]);
    expect(selectedAdherence(cycles, [2, 0])).toEqual({ done: 3, planned: 5, percent: 60 });
  });
  it('ignores absent measurements but includes recorded zero in statistics', () => {
    expect(metricSummary([{ value: null }, { value: 0 }, { value: 12 }], 'value')).toEqual({
      average: 6,
      max: 12,
      min: 0,
      total: 12,
    });
    expect(metricSummary([], 'value')).toEqual({ average: null, max: null, min: null, total: null });
  });
});
