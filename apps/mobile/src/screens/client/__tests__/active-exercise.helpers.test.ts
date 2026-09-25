import { buildLogPayload, draftHasValues, getSetColumns, readTargetValue } from '../active-exercise.helpers';
import type { SessionItem } from '../../../data/hooks/useTodaySession';

describe('active-exercise.helpers', () => {
  it('returns four columns for strength items', () => {
    const item = { type: 'strength', lockedFields: [] } as unknown as SessionItem;
    expect(getSetColumns(item).map((column) => column.key)).toEqual(['reps', 'rir', 'rpe', 'weight']);
  });

  it('hides locked strength columns', () => {
    const item = { type: 'strength', lockedFields: ['weightKg', 'rir'] } as unknown as SessionItem;
    expect(getSetColumns(item).map((column) => column.key)).toEqual(['reps', 'rpe']);
  });

  it('builds strength log payload from draft values', () => {
    const item = { type: 'strength', id: 'item-1', lockedFields: [] } as unknown as SessionItem;
    const payload = buildLogPayload(item, 1, {
      distance: '',
      duration: '',
      heartRate: '',
      reps: '8',
      rest: '',
      rir: '2',
      rpe: '8',
      rom: '',
      weight: '60',
    });

    expect(payload).toEqual({
      effortRir: 2,
      effortRpe: 8,
      repsDone: 8,
      sessionItemId: 'item-1',
      setIndex: 1,
      weightDoneKg: 60,
    });
  });

  it('reads per-set strength targets from planned sets', () => {
    const item = {
      type: 'strength',
      plannedSets: [
        { advancedTechnique: null, note: null, reps: 10, rir: 2, rpe: 8, setIndex: 0, weightKg: 60 },
        { advancedTechnique: null, note: null, reps: 8, rir: 1, rpe: 9, setIndex: 1, weightKg: 62.5 },
      ],
      repsMax: 12,
      repsMin: 8,
      targetRir: 3,
      targetRpe: 7,
      weightRangeMaxKg: 50,
    } as unknown as SessionItem;

    expect(readTargetValue(item, 1, 'reps')).toBe('10');
    expect(readTargetValue(item, 2, 'reps')).toBe('8');
    expect(readTargetValue(item, 1, 'weight')).toBe('60kg');
    expect(readTargetValue(item, 2, 'rir')).toBe('1');
  });

  it('detects draft rows with values', () => {
    expect(
      draftHasValues({
        distance: '',
        duration: '',
        heartRate: '',
        reps: '8',
        rest: '',
        rir: '',
        rpe: '',
        rom: '',
        weight: '',
      }),
    ).toBe(true);
    expect(
      draftHasValues({
        distance: '',
        duration: '',
        heartRate: '',
        reps: '',
        rest: '',
        rir: '',
        rpe: '',
        rom: '',
        weight: '',
      }),
    ).toBe(false);
  });
});
