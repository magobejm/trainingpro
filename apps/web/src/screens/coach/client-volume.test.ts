import { describe, expect, it } from 'vitest';
import { cardioBars, fourWeekRange, muscleBars, volumeSubtitle, volumeTotals } from './client-volume';

const t = (key: string, params?: Record<string, number | string>) => `${key}:${JSON.stringify(params ?? {})}`;

describe('fourWeekRange', () => {
  it('covers today and the 28 days before it', () => {
    expect(fourWeekRange(new Date(2026, 9, 27))).toEqual({ from: '2026-09-29', to: '2026-10-27' });
  });
});

describe('volumeTotals', () => {
  it('sums sets, tonnage and cardio minutes', () => {
    expect(
      volumeTotals({
        cardioWeekly: [{ methodType: 'run', totalDurationSeconds: 1800 }],
        strengthWeekly: [
          { muscleGroup: 'Pecho', totalSets: 8, volumeKg: 1200.4 },
          { muscleGroup: 'Espalda', totalSets: 6, volumeKg: 900 },
        ],
      }),
    ).toEqual({ cardioMinutes: 30, sets: 14, tonnageKg: 2100 });
  });

  it('is empty when the window has no work', () => {
    expect(volumeTotals({ cardioWeekly: [], strengthWeekly: [] })).toBeNull();
  });
});

describe('volumeSubtitle', () => {
  it('shows sets and tonnage', () => {
    expect(volumeSubtitle({ cardioMinutes: 10, sets: 14, tonnageKg: 2100 }, t)).toBe(
      'coach.volume.subtitle:{"kg":2100,"sets":14}',
    );
  });

  it('shows the cardio minutes when there is no strength work', () => {
    expect(volumeSubtitle({ cardioMinutes: 40, sets: 0, tonnageKg: 0 }, t)).toBe('coach.volume.cardioOnly:{"minutes":40}');
  });
});

describe('bars', () => {
  it('keeps one bar per muscle group and per cardio method', () => {
    expect(
      muscleBars([
        { muscleGroup: 'Pecho', totalSets: 4, volumeKg: 400 },
        { muscleGroup: 'Pecho', totalSets: 4, volumeKg: 500 },
      ]),
    ).toEqual([{ id: 'Pecho', label: 'Pecho', value: 900 }]);
    expect(
      cardioBars([
        { methodType: 'run', totalDurationSeconds: 600 },
        { methodType: 'run', totalDurationSeconds: 600 },
        { methodType: 'bike', totalDurationSeconds: 0 },
      ]),
    ).toEqual([{ id: 'run', label: 'run', value: 20 }]);
  });
});
