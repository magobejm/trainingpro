import { formatHeartRateBand, parseHeartRateBand, sanitizeHeartRateBandInput } from '@trainerpro/shared';
import { describe, expect, it } from 'vitest';
import { commitSeriesBand } from './seriesTableBand.utils';

const heartRange = { max: 150, min: 130 };
const percentRange = { max: 70, min: 60 };

describe('series band cell', () => {
  it('commits an exact value and a range from the same text field', () => {
    expect(parseHeartRateBand(sanitizeHeartRateBandInput('140'), 'heartRate')).toEqual({ min: 140, max: null });
    expect(parseHeartRateBand(sanitizeHeartRateBandInput('130-150'), 'heartRate')).toEqual({ min: 130, max: 150 });
    expect(parseHeartRateBand(sanitizeHeartRateBandInput('60-70'), 'percent')).toEqual({ min: 60, max: 70 });
    expect(formatHeartRateBand(130, 150)).toBe('130-150');
  });

  it('restores the previous band when the typed range is not valid', () => {
    expect(commitSeriesBand('130-', 'heartRate', heartRange)).toEqual({ ...heartRange, text: '130-150' });
    expect(commitSeriesBand('0', 'heartRate', heartRange)).toEqual({ ...heartRange, text: '130-150' });
    expect(commitSeriesBand('301', 'heartRate', heartRange)).toEqual({ ...heartRange, text: '130-150' });
    expect(commitSeriesBand('101', 'percent', percentRange)).toEqual({ ...percentRange, text: '60-70' });
    expect(commitSeriesBand('150-130', 'percent', percentRange)).toEqual({ ...percentRange, text: '60-70' });
    expect(commitSeriesBand('130-150-160', 'heartRate', heartRange)).toEqual({ ...heartRange, text: '130-150' });
  });

  it('orders a valid range and clears the field when the text is empty', () => {
    expect(commitSeriesBand('150-130', 'heartRate', { max: null, min: 140 })).toEqual({
      max: 150,
      min: 130,
      text: '130-150',
    });
    expect(commitSeriesBand('80-70', 'percent', { max: null, min: 60 })).toEqual({ max: 80, min: 70, text: '70-80' });
    expect(commitSeriesBand('', 'percent', percentRange)).toEqual({ max: null, min: null, text: '' });
  });
});
