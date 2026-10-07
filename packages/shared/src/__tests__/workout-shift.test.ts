import { weekdayName, workoutShift } from '../workout-shift';

describe('workoutShift', () => {
  it('marks an earlier session as brought forward from the planned day', () => {
    expect(workoutShift('2026-10-07', '2026-10-08')).toBe('early');
  });

  it('marks a later session as delayed from the planned day', () => {
    expect(workoutShift('2026-10-09', '2026-10-08')).toBe('late');
  });

  it('stays quiet when the workout stays on its planned day', () => {
    expect(workoutShift('2026-10-08', '2026-10-08')).toBeNull();
    expect(workoutShift('2026-10-08', null)).toBeNull();
  });
});

describe('weekdayName', () => {
  it('names the planned weekday in Spanish', () => {
    expect(weekdayName('2026-10-08', 'es-ES')).toBe('jueves');
  });
});
