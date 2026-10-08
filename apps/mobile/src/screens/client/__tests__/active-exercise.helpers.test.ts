import {
  buildClearPayload,
  buildLogPayload,
  draftHasValues,
  elapsedRestSeconds,
  formatSessionRepRange,
  getRestSeconds,
  getSetColumns,
  getSetCount,
  readActualValue,
  readSessionYoutubeUrl,
  readTargetValue,
  resolveSetSave,
  setWasLogged,
  type SetRowState,
} from '../active-exercise.helpers';
import type { SessionItem } from '../../../data/hooks/useTodaySession';

describe('getSetColumns', () => {
  it('returns strength columns in priority order', () => {
    const item = { type: 'strength', lockedFields: [] } as unknown as SessionItem;
    expect(getSetColumns(item).map((column) => column.key)).toEqual(['reps', 'weight', 'rpe', 'rir']);
  });

  it('shows six default sport columns and hides the locked extras', () => {
    const item = { type: 'sport', plannedSets: [] } as unknown as SessionItem;
    expect(getSetColumns(item).map((column) => column.key)).toEqual(['reps', 'weight', 'rpe', 'fcMaxPct', 'duration']);
  });

  it('hides locked strength columns', () => {
    const item = { type: 'strength', lockedFields: ['weightKg', 'rir'] } as unknown as SessionItem;
    expect(getSetColumns(item).map((column) => column.key)).toEqual(['reps', 'rpe']);
  });

  it('orders cardio, isometric, plio and mobility columns by priority', () => {
    const cardio = getSetColumns({ type: 'cardio', lockedFields: [] } as unknown as SessionItem);
    const isometric = getSetColumns({ type: 'isometric', lockedFields: [] } as unknown as SessionItem);
    const plio = getSetColumns({ type: 'plio', lockedFields: [] } as unknown as SessionItem);
    const mobility = getSetColumns({ type: 'mobility', lockedFields: [] } as unknown as SessionItem);

    expect(cardio.map((column) => column.key)).toEqual(['rpe', 'fcMaxPct', 'duration', 'heartRate', 'fcReservePct']);
    expect(isometric.map((column) => column.key)).toEqual(['weight', 'rpe', 'duration']);
    expect(plio.map((column) => column.key)).toEqual(['reps', 'weight', 'rpe', 'duration']);
    expect(mobility.map((column) => column.key)).toEqual(['reps', 'weight', 'rpe', 'rom']);
  });
});

describe('getRestSeconds', () => {
  it('uses the rest planned for that set and falls back to the exercise', () => {
    const item = {
      type: 'strength',
      lockedFields: [],
      plannedSets: [
        { restSeconds: 120, setIndex: 0 },
        { restSeconds: null, setIndex: 1 },
      ],
      restSeconds: 60,
    } as unknown as SessionItem;
    expect(getRestSeconds(item, 1)).toBe(120);
    expect(getRestSeconds(item, 2)).toBe(60);
  });

  it('counts the seconds that actually elapsed on the timer', () => {
    const endAt = 1_000_000;
    expect(elapsedRestSeconds(endAt, 60, endAt - 15_000)).toBe(45);
    expect(elapsedRestSeconds(endAt, 60, endAt)).toBe(60);
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

function emptyDraft(overrides: Partial<SetRowState> = {}): SetRowState {
  return {
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
    ...overrides,
  };
}

describe('buildLogPayload for all exercise types', () => {
  it('sends plio durationSecondsDone with the rest of the set', () => {
    const item = { type: 'plio', id: 'plio-1', lockedFields: [] } as unknown as SessionItem;
    expect(buildLogPayload(item, 2, emptyDraft({ duration: '15', reps: '10', rpe: '7', weight: '20' }))).toEqual({
      durationSecondsDone: 15,
      effortRpe: 7,
      repsDone: 10,
      sessionPlioBlockId: 'plio-1',
      setIndex: 2,
      weightDoneKg: 20,
    });
  });

  it('sends mobility weightDoneKg with rom', () => {
    const item = { type: 'mobility', id: 'mob-1', lockedFields: [] } as unknown as SessionItem;
    expect(buildLogPayload(item, 1, emptyDraft({ reps: '8', rom: 'completo', rpe: '5', weight: '8.5' }))).toEqual({
      effortRpe: 5,
      repsDone: 8,
      romDone: 'completo',
      sessionMobilityBlockId: 'mob-1',
      setIndex: 1,
      weightDoneKg: 8.5,
    });
  });

  it('sends cardio duration and rpe, and stores the timer rest separately', () => {
    const item = { type: 'cardio', id: 'cardio-1', lockedFields: [] } as unknown as SessionItem;
    const payload = buildLogPayload(
      item,
      1,
      emptyDraft({ duration: '120', heartRate: '145', rest: '30', rpe: '6', distance: '1000' }),
      47,
    );
    expect(payload).toEqual({
      avgHeartRate: 145,
      durationSecondsDone: 120,
      effortRpe: 6,
      intervalIndex: 1,
      restSecondsDone: 47,
      sessionCardioBlockId: 'cardio-1',
    });
    expect(payload).not.toHaveProperty('distanceDoneMeters');
  });

  it('sends sport set logs in seconds with setIndex and all visible fields', () => {
    const item = { type: 'sport', id: 'sport-1', lockedFields: [] } as unknown as SessionItem;
    expect(
      buildLogPayload(
        item,
        2,
        emptyDraft({
          duration: '90',
          fcMaxPct: '85',
          fcReservePct: '70',
          heartRate: '150',
          reps: '12',
          rest: '45',
          rir: '2',
          rpe: '8',
          rom: 'parcial',
          weight: '5',
        }),
      ),
    ).toEqual({
      durationSecondsDone: 90,
      effortRir: 2,
      effortRpe: 8,
      heartRateDone: 150,
      hrMaxPctDone: 85,
      hrReservePctDone: 70,
      repsDone: 12,
      romDone: 'parcial',
      sessionSportBlockId: 'sport-1',
      setIndex: 2,
      weightDoneKg: 5,
    });
  });
});

describe('getSetCount and readActualValue for sport', () => {
  it('counts sport sets from plannedSets', () => {
    const item = {
      type: 'sport',
      plannedSets: [{ setIndex: 1 }, { setIndex: 2 }, { setIndex: 3 }],
    } as unknown as SessionItem;
    expect(getSetCount(item)).toBe(3);
  });

  it('reads sport set logs by setIndex in seconds', () => {
    const item = {
      type: 'sport',
      log: null,
      setLogs: [
        {
          durationSecondsDone: 90,
          effortRir: 2,
          effortRpe: 8,
          heartRateDone: 150,
          hrMaxPctDone: 85,
          hrReservePctDone: 70,
          repsDone: 12,
          restSecondsDone: 45,
          romDone: 'parcial',
          sessionSportBlockId: 'sport-1',
          setIndex: 2,
          weightDoneKg: 5,
        },
      ],
    } as unknown as SessionItem;
    expect(readActualValue(item, 2, 'reps')).toBe('12');
    expect(readActualValue(item, 2, 'weight')).toBe('5');
    expect(readActualValue(item, 2, 'duration')).toBe('90');
    expect(readActualValue(item, 2, 'rom')).toBe('parcial');
    expect(readActualValue(item, 1, 'reps')).toBe('');
  });

  it('reads plio duration and mobility weight from logs', () => {
    const plio = {
      type: 'plio',
      logs: [
        { durationSecondsDone: 15, effortRpe: 7, repsDone: 8, sessionPlioBlockId: 'p1', setIndex: 1, weightDoneKg: 20 },
      ],
    } as unknown as SessionItem;
    const mobility = {
      type: 'mobility',
      logs: [
        {
          effortRpe: 6,
          repsDone: 10,
          romDone: 'completo',
          sessionMobilityBlockId: 'm1',
          setIndex: 1,
          weightDoneKg: 8.5,
        },
      ],
    } as unknown as SessionItem;
    expect(readActualValue(plio, 1, 'duration')).toBe('15');
    expect(readActualValue(mobility, 1, 'weight')).toBe('8.5');
  });
});

describe('empty sets', () => {
  const item = { type: 'strength', id: 'item-1', lockedFields: [], logs: [] } as unknown as SessionItem;

  it('does not build a save payload for an empty or zero-only set', () => {
    expect(buildLogPayload(item, 3, emptyDraft())).toBeNull();
    expect(buildLogPayload(item, 3, emptyDraft({ reps: '0', weight: '0' }))).toBeNull();
  });

  it('deletes a previously saved set that is cleared and skips one that was never saved', () => {
    expect(resolveSetSave(null, false)).toBe('skip');
    expect(resolveSetSave(null, true)).toBe('delete');
    expect(resolveSetSave({ sessionItemId: 'item-1', setIndex: 1 }, false)).toBe('save');
    expect(setWasLogged({ ...item, logs: [{ setIndex: 1 }] } as unknown as SessionItem, 1)).toBe(true);
    expect(setWasLogged(item, 1)).toBe(false);
    expect(buildClearPayload(item, 3)).toEqual({
      effortRir: null,
      effortRpe: null,
      repsDone: null,
      sessionItemId: 'item-1',
      setIndex: 3,
      weightDoneKg: null,
    });
  });
});
