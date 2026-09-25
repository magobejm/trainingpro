import { circularProgressOffset, circularRingMetrics } from '../circular-countdown.utils';

describe('circular-countdown.utils', () => {
  it('computes ring geometry', () => {
    expect(circularRingMetrics(100, 10)).toEqual({
      circumference: 2 * Math.PI * 45,
      cx: 50,
      cy: 50,
      radius: 45,
    });
  });

  it('maps remaining time to stroke offset', () => {
    expect(circularProgressOffset(90, 90, 100)).toBe(0);
    expect(circularProgressOffset(45, 90, 100)).toBe(50);
    expect(circularProgressOffset(0, 90, 100)).toBe(100);
    expect(circularProgressOffset(10, 0, 100)).toBe(100);
  });
});
