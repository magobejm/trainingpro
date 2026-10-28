import {
  MAX_ACTIVE_SET_VARIABLES,
  SPORT_DEFAULT_LOCKED_VARIABLES,
  canUnlockSetVariable,
  resolveLockedFields,
  setVariablesForType,
} from '../exercise-set-variables';

describe('setVariablesForType', () => {
  it('orders strength variables by priority', () => {
    expect(setVariablesForType('strength')).toEqual(['reps', 'weightKg', 'rpe', 'rir', 'restSeconds']);
  });

  it('orders cardio variables by priority', () => {
    expect(setVariablesForType('cardio')).toEqual([
      'rpe',
      'fcMaxPct',
      'durationSeconds',
      'distanceMeters',
      'heartRate',
      'fcReservePct',
      'restSeconds',
    ]);
  });

  it('orders isometric variables by priority', () => {
    expect(setVariablesForType('isometric')).toEqual(['weightKg', 'rpe', 'durationSeconds', 'restSeconds']);
  });

  it('orders plio variables by priority', () => {
    expect(setVariablesForType('plio')).toEqual(['reps', 'weightKg', 'rpe', 'durationSeconds', 'restSeconds']);
  });

  it('orders mobility variables by priority', () => {
    expect(setVariablesForType('mobility')).toEqual(['reps', 'weightKg', 'rpe', 'rom', 'restSeconds']);
  });

  it('keeps every sport variable in the global priority order', () => {
    expect(setVariablesForType('sport')).toEqual([
      'reps',
      'weightKg',
      'rpe',
      'fcMaxPct',
      'durationSeconds',
      'distanceMeters',
      'heartRate',
      'rir',
      'fcReservePct',
      'rom',
      'restSeconds',
    ]);
  });
});

describe('sport lock defaults', () => {
  it('locks the four extra sport variables by default', () => {
    expect(SPORT_DEFAULT_LOCKED_VARIABLES).toEqual(['heartRate', 'rir', 'fcReservePct', 'rom', 'durationSeconds']);
    expect(resolveLockedFields('sport', [])).toEqual(SPORT_DEFAULT_LOCKED_VARIABLES);
  });

  it('keeps an explicit sport lock list', () => {
    expect(resolveLockedFields('sport', ['rir', 'rom'])).toEqual(['rir', 'rom']);
  });

  it('blocks unlocking a seventh sport variable', () => {
    expect(MAX_ACTIVE_SET_VARIABLES).toBe(6);
    expect(canUnlockSetVariable('sport', SPORT_DEFAULT_LOCKED_VARIABLES, 'rir')).toBe(false);
  });

  it('allows unlocking after locking an active sport variable', () => {
    expect(canUnlockSetVariable('sport', ['reps', 'heartRate', 'rir', 'fcReservePct', 'rom', 'restSeconds'], 'rir')).toBe(
      true,
    );
  });
});

describe('cardio defaults and variable availability', () => {
  it('locks duration so six cardio variables, including distance, stay active', () => {
    expect(resolveLockedFields('cardio')).toEqual(['durationSeconds']);
    expect(resolveLockedFields('cardio', ['rpe'])).toEqual(['rpe']);
    expect(canUnlockSetVariable('cardio', ['durationSeconds'], 'durationSeconds')).toBe(false);
    expect(canUnlockSetVariable('cardio', ['durationSeconds', 'rpe'], 'durationSeconds')).toBe(true);
  });
  it.each(['strength', 'plio', 'mobility', 'isometric'] as const)('does not add distance to %s', (type) => {
    expect(setVariablesForType(type)).not.toContain('distanceMeters');
  });
});
