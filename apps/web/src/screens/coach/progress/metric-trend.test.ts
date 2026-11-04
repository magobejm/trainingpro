import { describe, expect, it } from 'vitest';
import { metricTrend } from './dashboard-model';

describe('metricTrend', () => {
  it('measures the change from the first recorded value and the straight trend between points', () => {
    const rising = metricTrend([0, 0, 14500, 10000]);
    expect(rising.current).toBe(10000);
    expect(rising.percent).toBe(0);
    expect(rising.direction).toBe('up');
    expect(rising.average).toBe(6125);
    expect(rising.line[0]).toBeLessThan(rising.line[3]!);
    const falling = metricTrend([100, null, 50]);
    expect(falling.percent).toBe(-50);
    expect(falling.direction).toBe('down');
    expect(falling.line[1]).toBe(75);
    expect(metricTrend([8, 8, 8])).toMatchObject({ percent: 0, direction: 'flat', current: 8 });
    expect(metricTrend([null, null])).toMatchObject({ current: null, average: null, percent: 0, direction: 'flat' });
  });
});
