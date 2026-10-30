import {
  circularProgressOffset,
  circularRingMetrics,
  countdownFaceFontSize,
  countdownFaceParts,
} from '../circular-countdown.utils';

describe('circular-countdown.utils', () => {
  it('computes ring geometry', () => {
    expect(circularRingMetrics(100, 10)).toEqual({
      circumference: 2 * Math.PI * 45,
      cx: 50,
      cy: 50,
      radius: 45,
    });
  });

  it('leaves the 40px set ring blank and stacks the 220px rest ring', () => {
    expect(countdownFaceParts(40, 3930)).toEqual([]);
    expect(countdownFaceParts(71, 45)).toEqual([]);
    expect(countdownFaceParts(72, 45)).toEqual([{ unit: 's', value: 45 }]);
    expect(countdownFaceParts(220, 45)).toEqual([{ unit: 's', value: 45 }]);
    expect(countdownFaceParts(220, 120)).toEqual([
      { unit: 'min', value: 2 },
      { unit: 's', value: 0 },
    ]);
    expect(countdownFaceParts(220, 3930)).toEqual([
      { unit: 'h', value: 1 },
      { unit: 'min', value: 5 },
      { unit: 's', value: 30 },
    ]);
    expect(countdownFaceFontSize(countdownFaceParts(220, 3930).length)).toBe(22);
    expect(countdownFaceFontSize(2)).toBe(28);
    expect(countdownFaceFontSize(1)).toBe(36);
  });

  it('maps remaining time to stroke offset', () => {
    expect(circularProgressOffset(90, 90, 100)).toBe(0);
    expect(circularProgressOffset(45, 90, 100)).toBe(50);
    expect(circularProgressOffset(0, 90, 100)).toBe(100);
    expect(circularProgressOffset(10, 0, 100)).toBe(100);
  });
});
