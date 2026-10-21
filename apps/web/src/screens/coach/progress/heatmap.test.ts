import { describe, expect, it } from 'vitest';
import { buildHeatmap, heatmapRange } from './heatmap';

describe('buildHeatmap', () => {
  const today = new Date('2026-10-13T12:00:00.000Z');

  it('covers 26 Monday-Sunday weeks and paints trained days', () => {
    const model = buildHeatmap(
      [
        { sessionDate: '2026-10-12', totalTonnage: 100 },
        { sessionDate: '2026-10-13', totalTonnage: 400 },
      ],
      today,
    );
    expect(model.weeks).toHaveLength(26);
    expect(model.weeks[0]).toHaveLength(7);
    expect(model.weeks[0]?.[0]?.date).toBe(heatmapRange(today).from);
    expect(model.trainedDays).toBe(2);
    expect(model.currentStreak).toBe(2);
    const todayCell = model.weeks.flat().find((cell) => cell.date === '2026-10-13');
    expect(todayCell?.level).toBeGreaterThan(0);
    expect(model.weeks.flat().find((cell) => cell.date === '2026-10-11')?.level).toBe(0);
  });

  it('ends the current streak the day before today when today is empty', () => {
    const model = buildHeatmap([{ sessionDate: '2026-10-12', totalTonnage: 50 }], today);
    expect(model.currentStreak).toBe(1);
    expect(model.bestStreak).toBe(1);
  });
});

it('counts completed cardio and partial activity without inventing tonnage', () => {
  const model = buildHeatmap(
    [
      { sessionDate: '2026-10-12', totalTonnage: null, outcome: 'done' },
      { sessionDate: '2026-10-13', totalTonnage: null, outcome: 'incomplete', hasRecordedData: true },
      { sessionDate: '2026-10-14', totalTonnage: null, outcome: 'skipped' },
      { sessionDate: '2026-10-15', totalTonnage: null, outcome: 'incomplete', hasRecordedData: false },
    ],
    new Date('2026-10-15T12:00:00Z'),
  );
  expect(model.trainedDays).toBe(2);
  expect(model.weeks.flat().find((c) => c.date === '2026-10-12')).toMatchObject({ active: true, tonnage: null, level: 1 });
  expect(model.weeks.flat().find((c) => c.date === '2026-10-14')?.level).toBe(0);
});
