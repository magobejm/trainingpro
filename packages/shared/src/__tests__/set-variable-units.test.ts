import {
  fromSetDisplayValue,
  toSetDisplayValue,
  normalizeLegacyLockedFields,
  normalizeRoutineSetVariables,
} from '../set-variable-units';

describe('set variable units', () => {
  it('stores kilometres in integer metres', () => {
    expect(fromSetDisplayValue('cardio', 'distanceMeters', 1.25)).toBe(1250);
    expect(toSetDisplayValue('sport', 'distanceMeters', 1250)).toBe(1.25);
  });
  it('keeps all set durations in seconds', () => {
    for (const type of ['cardio', 'sport'] as const) {
      expect(fromSetDisplayValue(type, 'durationSeconds', 150)).toBe(150);
      expect(toSetDisplayValue(type, 'durationSeconds', 150)).toBe(150);
    }
    expect(fromSetDisplayValue('plio', 'durationSeconds', 150)).toBe(150);
    expect(toSetDisplayValue('isometric', 'durationSeconds', 150)).toBe(150);
    expect(toSetDisplayValue('cardio', 'restSeconds', 150)).toBe(150);
  });
  it('round trips a legacy duration without losing seconds', () => {
    expect(fromSetDisplayValue('sport', 'durationSeconds', toSetDisplayValue('sport', 'durationSeconds', 91))).toBe(91);
  });
  it('preserves legacy active variables when distance exceeds the limit', () => {
    expect(normalizeLegacyLockedFields('cardio', [])).toEqual([]);
    expect(normalizeLegacyLockedFields('sport', [])).toEqual(['heartRate', 'rir', 'fcReservePct', 'rom', 'distanceMeters']);
    expect(normalizeLegacyLockedFields('cardio', ['rpe'])).toEqual(['rpe']);
    expect(normalizeLegacyLockedFields('sport', ['heartRate', 'rir', 'fcReservePct', 'rom', 'weightKg'])).toEqual([
      'heartRate',
      'rir',
      'fcReservePct',
      'rom',
      'weightKg',
    ]);
  });
});

it('normalizes old revisions without changing values or applying defaults twice', () => {
  const old = {
    days: [{ cardioBlocks: [{ lockedFields: [], sets: [{ durationSeconds: 90 }] }], sportBlocks: [{ lockedFields: [] }] }],
  };
  const next = normalizeRoutineSetVariables(old);
  expect(next.days[0]?.cardioBlocks[0]?.lockedFields).toEqual([]);
  expect(next.days[0]?.sportBlocks[0]?.lockedFields).toEqual(['heartRate', 'rir', 'fcReservePct', 'rom', 'distanceMeters']);
  expect(old.days[0]?.cardioBlocks[0]?.lockedFields).toEqual([]);
  expect(normalizeRoutineSetVariables(next)).toBe(next);
});
