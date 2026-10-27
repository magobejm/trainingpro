import { isLowAdherence, isLowMorningCheckin, lowCheckinFields, routineAlert } from '../triage/coach-home-rules';

describe('lowCheckinFields', () => {
  it('marca las notas por debajo de 3 y el dolor alto', () => {
    expect(lowCheckinFields({ motivation: 2, pain: 4, recovery: 3, sleep: 1 })).toEqual(['sleep', 'motivation', 'pain']);
  });
  it('no avisa con notas de 3 o mas', () => {
    expect(isLowMorningCheckin({ motivation: 3, pain: null, recovery: 5, sleep: 3 })).toBe(false);
  });
});

describe('routineAlert', () => {
  const today = '2026-10-26';
  it('sin rutina', () => {
    expect(routineAlert({ hasRoutine: false, lastWorkoutDay: null, today })).toEqual({ kind: 'noRoutine' });
  });
  it('sin calendario', () => {
    expect(routineAlert({ hasRoutine: true, lastWorkoutDay: null, today })).toEqual({ kind: 'noCalendar' });
  });
  it('quedan 14 dias o menos', () => {
    expect(routineAlert({ hasRoutine: true, lastWorkoutDay: '2026-11-09', today })).toEqual({
      daysLeft: 14,
      kind: 'ending',
    });
    expect(routineAlert({ hasRoutine: true, lastWorkoutDay: '2026-11-10', today })).toBeNull();
  });
});

describe('isLowAdherence', () => {
  it('por debajo del 50 % o 3 dias sin entreno', () => {
    expect(isLowAdherence({ daysWithoutWorkout: 1, weekAdherence: 0.25 })).toBe(true);
    expect(isLowAdherence({ daysWithoutWorkout: 3, weekAdherence: 1 })).toBe(true);
    expect(isLowAdherence({ daysWithoutWorkout: 2, weekAdherence: 0.5 })).toBe(false);
    expect(isLowAdherence({ daysWithoutWorkout: null, weekAdherence: null })).toBe(false);
  });
});
