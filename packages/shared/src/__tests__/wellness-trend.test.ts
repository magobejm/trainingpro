import { averageOfSeries, buildWellnessTrend, rpeToScale } from '../wellness-trend';

describe('wellness-trend', () => {
  it('divide el RPE entre 2 y conserva el real', () => {
    expect(rpeToScale(7)).toBe(3.5);
    expect(rpeToScale(null)).toBeNull();
  });

  it('crea un punto por día con huecos null y marca los días entrenados', () => {
    const points = buildWellnessTrend({
      checkins: [{ date: '2026-11-07', motivation: 4, recovery: null, sleep: 3 }],
      endDate: '2026-11-08',
      range: 7,
      sessions: [
        { sessionDate: '2026-11-08', sessionRpe: 8 },
        { sessionDate: '2026-11-06', sessionRpe: null },
        { sessionDate: '2026-11-05', sessionRpe: 5, isCompleted: false },
      ],
    });
    expect(points).toHaveLength(7);
    expect(points[0]?.date).toBe('2026-11-02');
    const rest = points.find((p) => p.date === '2026-11-07');
    expect(rest).toMatchObject({ motivation: 4, recovery: null, rpe: null, trained: false });
    expect(points.find((p) => p.date === '2026-11-08')).toMatchObject({ rpe: 8, rpeScaled: 4, trained: true });
    expect(points.find((p) => p.date === '2026-11-06')).toMatchObject({ rpe: null, trained: true });
    expect(points.find((p) => p.date === '2026-11-05')?.trained).toBe(false);
  });

  it('la media ignora los huecos', () => {
    expect(averageOfSeries([4, null, 2])).toBe(3);
    expect(averageOfSeries([null])).toBeNull();
  });

  it('30 días da 30 puntos', () => {
    expect(buildWellnessTrend({ checkins: [], endDate: '2026-11-08', range: 30, sessions: [] })).toHaveLength(30);
  });
});
