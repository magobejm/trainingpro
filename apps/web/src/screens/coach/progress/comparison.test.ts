import { describe, expect, it } from 'vitest';
import { buildComparison, buildMeasureComparison, comparisonDates, markEvolution, measureEvolution } from './comparison';

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

  it('reads the number inside a scored test and keeps its unit', () => {
    const scored = [
      { measuredAt: '2026-07-15T10:00:00.000Z', name: 'Apoyo', value: '240 s' },
      { measuredAt: '2026-10-09T10:00:00.000Z', name: 'Apoyo', value: '600 s' },
    ];
    const result = buildComparison([], scored, '2026-07-15', '2026-10-09');
    expect(result.rows).toEqual([{ after: '600 s', before: '240 s', delta: '+360 s', name: 'Apoyo' }]);
  });
});

describe('buildMeasureComparison', () => {
  it('includes measurement dates and the change between the two sides', () => {
    const measures = [
      { bodyFatPct: 22, hipCm: 102, measuredAt: '2026-07-15T10:00:00.000Z', waistCm: 86, weightKg: 74 },
      { bodyFatPct: 18, hipCm: 98, measuredAt: '2026-10-09T10:00:00.000Z', waistCm: 78, weightKg: 68.5 },
    ];
    expect(comparisonDates([], [], measures)).toEqual(['2026-07-15', '2026-10-09']);
    expect(buildMeasureComparison(measures, '2026-07-15', '2026-10-09')).toEqual([
      { after: '68.5 kg', before: '74 kg', delta: '-5.5 kg', name: 'weightKg' },
      { after: '78 cm', before: '86 cm', delta: '-8 cm', name: 'waistCm' },
      { after: '98 cm', before: '102 cm', delta: '-4 cm', name: 'hipCm' },
      { after: '18 %', before: '22 %', delta: '-4 %', name: 'bodyFatPct' },
    ]);
  });

  it('keeps each recorded weight between the two dates, including a swapped range', () => {
    const measures = [
      { bodyFatPct: null, hipCm: null, measuredAt: '2026-06-01T10:00:00.000Z', waistCm: null, weightKg: 80 },
      { bodyFatPct: null, hipCm: null, measuredAt: '2026-07-15T10:00:00.000Z', waistCm: 86, weightKg: 74 },
      { bodyFatPct: null, hipCm: null, measuredAt: '2026-07-15T18:00:00.000Z', waistCm: 86, weightKg: 73.5 },
      { bodyFatPct: null, hipCm: null, measuredAt: '2026-10-09T10:00:00.000Z', waistCm: 78, weightKg: 68.5 },
      { bodyFatPct: null, hipCm: null, measuredAt: '2026-11-01T10:00:00.000Z', waistCm: null, weightKg: 67 },
    ];
    expect(measureEvolution(measures, 'weightKg', '2026-10-09', '2026-07-15')).toEqual([
      { day: '2026-07-15', value: 73.5 },
      { day: '2026-10-09', value: 68.5 },
    ]);
  });
});

describe('score formats', () => {
  it.each([
    ['2200 m', '2500 m', '+300 m'],
    ['18 reps', '28 reps', '+10 reps'],
    ['110 ppm', '92 ppm', '-18 ppm'],
    ['24 cm', '33 cm', '+9 cm'],
    ['-2.4 cm', '1.3 cm', '+3.7 cm'],
    ['5.19 s', '4.52 s', '-0.7 s'],
    ['4,50 s', '4,20 s', '-0.3 s'],
    ['Palier 6', 'Palier 9', '+3'],
    ['0 s', '0 s', '0 s'],
    ['10 reps', '12 m', '+2'],
    ['Registrado', 'Registrado', '—'],
    ['NaN ml/kg/min', '32.4 ml/kg/min', '—'],
    ['Error en cálculo', '12 reps', '—'],
  ])('compares %s with %s as %s', (before, after, change) => {
    const marks = [
      { measuredAt: '2026-07-15T10:00:00.000Z', name: 'Prueba', value: before },
      { measuredAt: '2026-10-09T10:00:00.000Z', name: 'Prueba', value: after },
    ];
    expect(buildComparison([], marks, '2026-07-15', '2026-10-09').rows[0]?.delta).toBe(change);
  });
});

describe('markEvolution', () => {
  it('reads the number of each test inside the range and keeps the latest mark of a day', () => {
    const scored = [
      { measuredAt: '2026-06-01T10:00:00.000Z', name: 'Apoyo', value: '100 s' },
      { measuredAt: '2026-07-15T10:00:00.000Z', name: 'Apoyo', value: '240 s' },
      { measuredAt: '2026-07-15T18:00:00.000Z', name: 'Apoyo', value: '250 s' },
      { measuredAt: '2026-10-09T10:00:00.000Z', name: 'Apoyo', value: '600 s' },
      { measuredAt: '2026-11-01T10:00:00.000Z', name: 'Apoyo', value: '700 s' },
    ];
    expect(markEvolution(scored, 'Apoyo', '2026-07-15', '2026-10-09')).toEqual([
      { day: '2026-07-15', value: 250 },
      { day: '2026-10-09', value: 600 },
    ]);
  });
});
