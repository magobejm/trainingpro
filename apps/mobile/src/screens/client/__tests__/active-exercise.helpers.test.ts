import {
  buildLogPayload,
  draftHasValues,
  formatSessionRepRange,
  getSetColumns,
  readSessionYoutubeUrl,
  readTargetValue,
} from '../active-exercise.helpers';
import type { SessionItem } from '../../../data/hooks/useTodaySession';

describe('getSetColumns', () => {
  it('returns strength columns in priority order', () => {
    const item = { type: 'strength', lockedFields: [] } as unknown as SessionItem;
    expect(getSetColumns(item).map((column) => column.key)).toEqual(['reps', 'weight', 'rpe', 'rir', 'rest']);
  });

  it('shows six default sport columns and hides the locked extras', () => {
    const item = { type: 'sport', plannedSets: [] } as unknown as SessionItem;
    expect(getSetColumns(item).map((column) => column.key)).toEqual([
      'reps',
      'weight',
      'rpe',
      'fcMaxPct',
      'duration',
      'rest',
    ]);
  });

  it('hides locked strength columns', () => {
    const item = { type: 'strength', lockedFields: ['weightKg', 'rir'] } as unknown as SessionItem;
    expect(getSetColumns(item).map((column) => column.key)).toEqual(['reps', 'rpe', 'rest']);
  });

  it('orders cardio, isometric, plio and mobility columns by priority', () => {
    const cardio = getSetColumns({ type: 'cardio', lockedFields: [] } as unknown as SessionItem);
    const isometric = getSetColumns({ type: 'isometric', lockedFields: [] } as unknown as SessionItem);
    const plio = getSetColumns({ type: 'plio', lockedFields: [] } as unknown as SessionItem);
    const mobility = getSetColumns({ type: 'mobility', lockedFields: [] } as unknown as SessionItem);

    expect(cardio.map((column) => column.key)).toEqual(['rpe', 'fcMaxPct', 'duration', 'heartRate', 'fcReservePct', 'rest']);
    expect(isometric.map((column) => column.key)).toEqual(['weight', 'rpe', 'duration', 'rest']);
    expect(plio.map((column) => column.key)).toEqual(['reps', 'weight', 'rpe', 'duration', 'rest']);
    expect(mobility.map((column) => column.key)).toEqual(['reps', 'weight', 'rpe', 'rom', 'rest']);
  });
});

describe('readSessionYoutubeUrl', () => {
  it('returns a trimmed youtube url from the session item', () => {
    expect(
      readSessionYoutubeUrl({
        type: 'strength',
        youtubeUrl: ' https://youtu.be/abc ',
      } as unknown as SessionItem),
    ).toBe('https://youtu.be/abc');
  });

  it('returns null when the session item has no video', () => {
    expect(readSessionYoutubeUrl({ type: 'strength' } as unknown as SessionItem)).toBeNull();
    expect(readSessionYoutubeUrl({ type: 'plio', youtubeUrl: '  ' } as unknown as SessionItem)).toBeNull();
    expect(
      readSessionYoutubeUrl({ type: 'cardio', youtubeUrl: 'https://example.com/clip' } as unknown as SessionItem),
    ).toBeNull();
  });
});

describe('active-exercise.helpers', () => {
  it('builds strength log payload from draft values', () => {
    const item = { type: 'strength', id: 'item-1', lockedFields: [] } as unknown as SessionItem;
    const payload = buildLogPayload(item, 1, {
      distance: '',
      duration: '',
      fcMaxPct: '',
      fcReservePct: '',
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
        fcMaxPct: '',
        fcReservePct: '',
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
        fcMaxPct: '',
        fcReservePct: '',
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

describe('formatSessionRepRange', () => {
  it('shows the session rep range for strength, plio, mobility and sport', () => {
    expect(
      formatSessionRepRange({
        type: 'strength',
        repsMin: 6,
        repsMax: 12,
        plannedSets: [],
      } as unknown as SessionItem),
    ).toBe('6-12');
    expect(
      formatSessionRepRange({
        type: 'plio',
        plannedSets: [
          { reps: 8, setIndex: 0 },
          { reps: 10, setIndex: 1 },
        ],
      } as unknown as SessionItem),
    ).toBe('8-10');
    expect(
      formatSessionRepRange({
        type: 'mobility',
        plannedSets: [{ reps: 12, setIndex: 0 }],
      } as unknown as SessionItem),
    ).toBe('12');
    expect(
      formatSessionRepRange({
        type: 'sport',
        plannedSets: [{ reps: 15, setIndex: 0 }],
      } as unknown as SessionItem),
    ).toBe('15');
  });

  it('hides the session rep range for cardio and isometric', () => {
    expect(
      formatSessionRepRange({
        type: 'cardio',
        plannedSets: [{ reps: 20, setIndex: 0 }],
      } as unknown as SessionItem),
    ).toBeNull();
    expect(
      formatSessionRepRange({
        type: 'isometric',
        plannedSets: [{ reps: 30, setIndex: 0 }],
      } as unknown as SessionItem),
    ).toBeNull();
  });
});
