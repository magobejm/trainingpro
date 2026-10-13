import { describe, expect, it } from 'vitest';
import { buildComparison, comparisonDates } from './comparison';

const photos = [
  { createdAt: '2026-01-01T10:00:00.000Z', imageUrl: 'a' },
  { createdAt: '2026-06-01T10:00:00.000Z', imageUrl: 'b' },
];
const marks = [
  { measuredAt: '2026-01-15T00:00:00.000Z', name: 'Salto', value: '40' },
  { measuredAt: '2026-06-15T00:00:00.000Z', name: 'Salto', value: '46' },
];

describe('buildComparison', () => {
  it('lists the dates that have a photo or a test', () => {
    expect(comparisonDates(photos, marks)).toEqual(['2026-01-01', '2026-01-15', '2026-06-01', '2026-06-15']);
  });

  it('uses the closest earlier photo and the latest test up to each date', () => {
    const result = buildComparison(photos, marks, '2026-03-01', '2026-07-01');
    expect(result.leftPhoto?.imageUrl).toBe('a');
    expect(result.rightPhoto?.imageUrl).toBe('b');
    expect(result.rows).toEqual([{ after: '46', before: '40', delta: '+6', name: 'Salto' }]);
  });
});
