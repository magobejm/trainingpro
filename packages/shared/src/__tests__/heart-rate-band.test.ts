import { formatHeartRateBand, heartRateBandPoint, parseHeartRateBand, sanitizeHeartRateBandInput } from '../heart-rate-band';

describe('heart rate band', () => {
  it('keeps an exact value and clears an empty field', () => {
    expect(parseHeartRateBand('140', 'heartRate')).toEqual({ min: 140, max: null });
    expect(parseHeartRateBand('  ', 'percent')).toEqual({ min: null, max: null });
    expect(formatHeartRateBand(140, null)).toBe('140');
    expect(formatHeartRateBand(null, null)).toBe('');
  });

  it('stores a range with the lower bound first', () => {
    expect(parseHeartRateBand('130-150', 'heartRate')).toEqual({ min: 130, max: 150 });
    expect(parseHeartRateBand('150-130', 'heartRate')).toEqual({ min: 130, max: 150 });
    expect(parseHeartRateBand('60 - 70', 'percent')).toEqual({ min: 60, max: 70 });
    expect(parseHeartRateBand('70-70', 'percent')).toEqual({ min: 70, max: null });
    expect(formatHeartRateBand(130, 150)).toBe('130-150');
  });

  it('rejects an incomplete range, a reversed-looking fragment, and values outside the scale', () => {
    expect(parseHeartRateBand('130-', 'heartRate')).toBeNull();
    expect(parseHeartRateBand('130-150-170', 'heartRate')).toBeNull();
    expect(parseHeartRateBand('0', 'heartRate')).toBeNull();
    expect(parseHeartRateBand('140.5', 'heartRate')).toBeNull();
    expect(parseHeartRateBand('101', 'percent')).toBeNull();
    expect(parseHeartRateBand('-1', 'percent')).toBeNull();
    expect(parseHeartRateBand('0-100', 'percent')).toEqual({ min: 0, max: 100 });
  });

  it('keeps one hyphen while the cell is being typed', () => {
    expect(sanitizeHeartRateBandInput('130-150 bpm')).toBe('130-150');
    expect(sanitizeHeartRateBandInput('130--150')).toBe('130-');
    expect(sanitizeHeartRateBandInput('70.25')).toBe('70');
  });

  it('plots the exact value, or the midpoint of a range', () => {
    expect(heartRateBandPoint(140, null)).toBe(140);
    expect(heartRateBandPoint(130, 150)).toBe(140);
    expect(heartRateBandPoint(60, 70)).toBe(65);
    expect(heartRateBandPoint(null, 150)).toBeNull();
  });
});
