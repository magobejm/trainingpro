import { describe, expect, it } from 'vitest';
import { defaultMeasureRange, inMeasureRange, measureRecords, measureSeries, type MeasureSource } from './client-measures';
import { measuresSubtitle } from './measures-subtitle';

const t = (key: string, params?: Record<string, number | string>): string =>
  `${key}:${Object.values(params ?? {}).join(',')}`;

function row(partial: Partial<MeasureSource> & Pick<MeasureSource, 'createdAt'>): MeasureSource {
  return {
    createdAt: partial.createdAt,
    heightCm: partial.heightCm ?? null,
    hipCm: partial.hipCm ?? null,
    measuredAt: partial.measuredAt,
    recordedBy: partial.recordedBy ?? 'coach',
    skinfoldsJson: partial.skinfoldsJson,
    waistCm: partial.waistCm ?? null,
    weightKg: partial.weightKg ?? null,
    bodyFatPct: partial.bodyFatPct,
    fcMax: partial.fcMax,
    fcRest: partial.fcRest,
  };
}

describe('measureSeries', () => {
  const items = [
    row({ createdAt: '2026-07-15T00:00:00.000Z', weightKg: 74, waistCm: 86, skinfoldsJson: { triceps: 14 } }),
    row({ createdAt: '2026-10-01T00:00:00.000Z', weightKg: 70, heightCm: 178 }),
    row({
      createdAt: '2026-10-09T00:00:00.000Z',
      weightKg: 68.5,
      waistCm: 78,
      skinfoldsJson: { triceps: 11, subscapular: 16 },
    }),
  ];

  it('draws a line only when the same number was written twice', () => {
    const keys = measureSeries(items).map((item) => item.key);
    expect(keys).toEqual(['weightKg', 'waistCm', 'triceps']);
  });

  it('keeps the later reading when two land on the same day', () => {
    const series = measureSeries([
      row({ createdAt: '2026-10-09T08:00:00.000Z', fcRest: 60 }),
      row({ createdAt: '2026-10-09T18:00:00.000Z', fcRest: 54 }),
      row({ createdAt: '2026-10-20T00:00:00.000Z', fcRest: 52 }),
    ]);
    expect(series[0]?.points).toEqual([
      { at: '2026-10-09', value: 54 },
      { at: '2026-10-20', value: 52 },
    ]);
  });
});

describe('measureRecords', () => {
  it('lists the newest day first and only the values of that day', () => {
    const records = measureRecords([
      row({ createdAt: '2026-07-15T00:00:00.000Z', recordedBy: 'client', weightKg: 74, hipCm: 102 }),
      row({ createdAt: '2026-10-20T00:00:00.000Z', recordedBy: 'coach', waistCm: 78, skinfoldsJson: { triceps: 11 } }),
    ]);
    expect(records[0]).toMatchObject({
      recordedBy: 'coach',
      values: [
        { key: 'waistCm', value: 78 },
        { key: 'triceps', value: 11 },
      ],
    });
    expect(records[1]?.values.map((item) => item.key)).toEqual(['weightKg', 'hipCm']);
  });
});

describe('defaultMeasureRange', () => {
  it('opens on the last year, ending today', () => {
    expect(defaultMeasureRange(new Date(2026, 9, 27))).toEqual({ from: '2025-10-27', to: '2026-10-27' });
  });

  it('keeps a day inside the window and drops the ones outside, swapping an inverted pair', () => {
    expect(inMeasureRange('2026-10-09T12:00:00.000Z', '2026-10-01', '2026-10-20')).toBe(true);
    expect(inMeasureRange('2026-07-15T00:00:00.000Z', '2026-10-01', '2026-10-20')).toBe(false);
    expect(inMeasureRange('2026-10-01T00:00:00.000Z', '2026-10-20', '2026-10-01')).toBe(true);
  });
});

describe('measuresSubtitle', () => {
  const formatDate = (iso: string): string => iso.slice(0, 10);

  it('stays empty when there is no weight and no waist', () => {
    expect(measuresSubtitle([row({ createdAt: '2026-10-01', heightCm: 178 })], t, formatDate)).toBeNull();
  });

  it('shares the date when the latest weight and waist are from the same day', () => {
    const text = measuresSubtitle(
      [
        row({ createdAt: '2026-10-20', weightKg: 68.5, waistCm: 78 }),
        row({ createdAt: '2026-07-15', weightKg: 74, waistCm: 86 }),
      ],
      t,
      formatDate,
    );
    expect(text).toBe('coach.measures.weightValue:68.5 · coach.measures.waistValue:78 · 2026-10-20');
  });

  it('keeps each date when they differ', () => {
    const text = measuresSubtitle(
      [row({ createdAt: '2026-10-20', weightKg: 68.5 }), row({ createdAt: '2026-10-09', waistCm: 78 })],
      t,
      formatDate,
    );
    expect(text).toBe('coach.measures.weightOn:2026-10-20,68.5 · coach.measures.waistOn:2026-10-09,78');
  });
});
