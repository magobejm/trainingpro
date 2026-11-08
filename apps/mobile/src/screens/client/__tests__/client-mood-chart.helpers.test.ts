import { buildWellnessTrend } from '@trainerpro/shared';
import { rpeBarHeight, seriesSegments, xAt, yAt, type ChartGeometry } from '../client-mood-chart.helpers';

const g: ChartGeometry = { height: 200, padBottom: 20, padLeft: 20, padRight: 10, padTop: 10, width: 330 };

describe('client-mood-chart helpers', () => {
  it('mapea 1 a la base y 5 al borde superior del eje', () => {
    expect(yAt(5, g)).toBe(10);
    expect(yAt(1, g)).toBe(180);
    expect(xAt(0, 7, g)).toBeLessThan(xAt(6, 7, g));
  });

  it('corta la línea en los días omitidos', () => {
    const points = buildWellnessTrend({
      checkins: [
        { date: '2026-11-02', motivation: 4, recovery: 3, sleep: 5 },
        { date: '2026-11-04', motivation: 2, recovery: 3, sleep: 4 },
        { date: '2026-11-05', motivation: 3, recovery: 3, sleep: 4 },
      ],
      endDate: '2026-11-08',
      range: 7,
      sessions: [],
    });
    expect(seriesSegments(points, 'motivation', g)).toHaveLength(2);
    expect(seriesSegments(points, 'sleep', g)[0]).toMatch(/^M /);
  });

  it('la barra de RPE parte de la línea base', () => {
    expect(rpeBarHeight(5, g)).toBe(170);
    expect(rpeBarHeight(0.5, g)).toBe(3);
  });
});
