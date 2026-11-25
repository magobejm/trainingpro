import { buildWellnessTrend } from '@trainerpro/shared';
import { rpeBarHeight, seriesSegments, xAt, yAt, type ChartGeometry } from '../client-mood-chart.helpers';

const g: ChartGeometry = { height: 200, padBottom: 20, padLeft: 20, padRight: 10, padTop: 10, width: 330 };

describe('client-mood-chart helpers', () => {
  it('mapea 1 a la base y 5 al borde superior del eje', () => {
    expect(yAt(5, g)).toBe(10);
    expect(yAt(1, g)).toBe(180);
    expect(xAt(0, 7, g)).toBeLessThan(xAt(6, 7, g));
  });

  it('une los días con dato en una curva aunque falte un día en medio', () => {
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
    const [path] = seriesSegments(points, 'motivation', g);
    expect(path?.startsWith(`M ${xAt(0, 7, g).toFixed(1)} ${yAt(4, g).toFixed(1)}`)).toBe(true);
    expect(path).toContain(`${xAt(2, 7, g).toFixed(1)} ${yAt(2, g).toFixed(1)}`);
    expect(path?.endsWith(`${xAt(3, 7, g).toFixed(1)} ${yAt(3, g).toFixed(1)}`)).toBe(true);
    expect(path).toContain('C ');
    expect(path).not.toContain(`${xAt(1, 7, g).toFixed(1)} `);
    expect(seriesSegments(points, 'recovery', g)).toHaveLength(1);
    expect(
      seriesSegments(
        [{ date: '2026-11-02', motivation: 4, recovery: null, rpe: null, rpeScaled: null, sleep: null, trained: false }],
        'sleep',
        g,
      ),
    ).toEqual([]);
  });

  it('la barra de RPE parte de la línea base', () => {
    expect(rpeBarHeight(5, g)).toBe(170);
    expect(rpeBarHeight(0.5, g)).toBe(3);
  });
});
