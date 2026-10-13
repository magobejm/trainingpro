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
