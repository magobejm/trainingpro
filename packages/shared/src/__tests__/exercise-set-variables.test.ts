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
    expect(SPORT_DEFAULT_LOCKED_VARIABLES).toEqual(['heartRate', 'rir', 'fcReservePct', 'rom']);
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
    expect(canUnlockSetVariable('sport', ['reps', 'heartRate', 'rir', 'fcReservePct', 'rom'], 'rir')).toBe(true);
  });
});
