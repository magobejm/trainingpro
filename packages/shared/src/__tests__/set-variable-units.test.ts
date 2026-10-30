import {
  carryClock,
  clockParts,
  commitClockDraft,
  formatClock,
  fromSetDisplayValue,
  toSetDisplayValue,
  visibleClockUnits,
  normalizeLegacyLockedFields,
  normalizeRoutineSetVariables,
  type ClockDraft,
} from '../set-variable-units';

describe('duration and rest clocks', () => {
  it('shows hours, minutes and seconds only when each larger unit is present', () => {
    expect(formatClock(45)).toBe('45 s');
    expect(clockParts(45)).toEqual([{ unit: 's', value: 45 }]);
    expect(formatClock(120)).toBe('2 min 0 s');
    expect(formatClock(125)).toBe('2 min 5 s');
    expect(formatClock(3600)).toBe('1 h 0 min 0 s');
    expect(formatClock(3661)).toBe('1 h 1 min 1 s');
    expect(formatClock(3930)).toBe('1 h 5 min 30 s');
  });

  it('carries past 59 into the next unit and keeps an empty total at zero', () => {
    expect(carryClock(0, 0, 90)).toBe(90);
    expect(formatClock(carryClock(0, 0, 90))).toBe('1 min 30 s');
    expect(formatClock(carryClock(0, 90, 0))).toBe('1 h 30 min 0 s');
    expect(carryClock(0, 0, 0)).toBe(0);
    expect(carryClock(24, 0, 1)).toBe(86400);
  });
});

function editedClock(stored: number | null, draft: ClockDraft) {
  const result = commitClockDraft(stored, draft);
  if (result.kind === 'empty') return { stored: null, units: visibleClockUnits(null), text: '' };
  if (result.kind === 'invalid') {
    return { stored, units: visibleClockUnits(stored), text: stored == null ? '' : formatClock(stored) };
  }
  return { stored: result.seconds, units: visibleClockUnits(result.seconds), text: formatClock(result.seconds) };
}

describe('editing a duration or rest clock', () => {
  it('keeps an empty field empty and stores zero as zero seconds', () => {
    expect(editedClock(null, { s: '' })).toEqual({ stored: null, units: ['s'], text: '' });
    expect(editedClock(45, { s: '' })).toEqual({ stored: null, units: ['s'], text: '' });
    expect(editedClock(null, { s: '0' })).toEqual({ stored: 0, units: ['s'], text: '0 s' });
  });

  it('carries past 59 and reveals the next counter, including a zero remainder', () => {
    expect(editedClock(null, { s: '45' })).toEqual({ stored: 45, units: ['s'], text: '45 s' });
    expect(editedClock(null, { s: '90' })).toEqual({ stored: 90, units: ['min', 's'], text: '1 min 30 s' });
    expect(editedClock(null, { s: '120' })).toEqual({ stored: 120, units: ['min', 's'], text: '2 min 0 s' });
    expect(editedClock(null, { s: '125' })).toEqual({ stored: 125, units: ['min', 's'], text: '2 min 5 s' });
    expect(editedClock(null, { s: '3600' })).toEqual({ stored: 3600, units: ['h', 'min', 's'], text: '1 h 0 min 0 s' });
    expect(editedClock(null, { s: '3930' })).toEqual({ stored: 3930, units: ['h', 'min', 's'], text: '1 h 5 min 30 s' });
  });

  it('ignores a hidden unit left in the draft and rejects a value that is not a whole number', () => {
    expect(editedClock(null, { h: '3', min: '9', s: '45' }).stored).toBe(45);
    expect(editedClock(125, { h: '4', min: '2', s: '5' })).toEqual({ stored: 125, units: ['min', 's'], text: '2 min 5 s' });
    expect(editedClock(45, { s: '1.5' })).toEqual({ stored: 45, units: ['s'], text: '45 s' });
  });

  it('caps a carried edit at 24 hours', () => {
    expect(editedClock(null, { s: '90000' }).stored).toBe(86400);
    expect(editedClock(null, { s: '90000' }).text).toBe('24 h 0 min 0 s');
  });
});

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
    expect(normalizeLegacyLockedFields('cardio', [])).toEqual(['durationSeconds']);
    expect(normalizeLegacyLockedFields('sport', ['heartRate', 'rir', 'fcReservePct', 'rom', 'restSeconds'])).toEqual([
      'heartRate',
      'rir',
      'fcReservePct',
      'rom',
      'durationSeconds',
    ]);
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
  expect(next.days[0]?.cardioBlocks[0]?.lockedFields).toEqual(['durationSeconds']);
  expect(next.days[0]?.sportBlocks[0]?.lockedFields).toEqual(['heartRate', 'rir', 'fcReservePct', 'rom', 'distanceMeters']);
  expect(old.days[0]?.cardioBlocks[0]?.lockedFields).toEqual([]);
  expect(normalizeRoutineSetVariables(next)).toBe(next);
});

it('rewrites only the stored default locks on a published revision', () => {
  const published = {
    setVariablesVersion: 2,
    days: [
      {
        cardioBlocks: [{ lockedFields: [] }],
        sportBlocks: [{ lockedFields: ['rom', 'restSeconds', 'heartRate', 'rir', 'fcReservePct'] }],
      },
    ],
  };
  const next = normalizeRoutineSetVariables(published);
  expect(next.days[0]?.cardioBlocks[0]?.lockedFields).toEqual(['durationSeconds']);
  expect(next.days[0]?.sportBlocks[0]?.lockedFields).toEqual(['heartRate', 'rir', 'fcReservePct', 'rom', 'durationSeconds']);
  expect(normalizeRoutineSetVariables(next)).toBe(next);
  const custom = { setVariablesVersion: 2, days: [{ sportBlocks: [{ lockedFields: ['rir'] }] }] };
  expect(normalizeRoutineSetVariables(custom)).toBe(custom);
});
