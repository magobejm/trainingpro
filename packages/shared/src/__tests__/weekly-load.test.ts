import {
  dismissLoadReminder,
  INITIAL_WEEKLY_LOAD_REMINDER,
  isMondayKey,
  mondayOfKey,
  nextWeekStart,
  postponeLoadReminder,
  shouldShowLoadReminder,
} from '../weekly-load';

// 2026-11-06 es viernes.
describe('weekly-load', () => {
  it('la semana siguiente es el lunes que viene, también desde el propio lunes', () => {
    expect(nextWeekStart('2026-11-02')).toBe('2026-11-09');
    expect(nextWeekStart('2026-11-06')).toBe('2026-11-09');
    expect(nextWeekStart('2026-11-08')).toBe('2026-11-09');
    expect(mondayOfKey('2026-11-08')).toBe('2026-11-02');
    expect(isMondayKey('2026-11-09')).toBe(true);
  });

  it('solo recuerda de viernes a domingo y si no hay nota', () => {
    const s = INITIAL_WEEKLY_LOAD_REMINDER;
    expect(shouldShowLoadReminder('2026-11-05', s, false)).toBe(false);
    expect(shouldShowLoadReminder('2026-11-06', s, false)).toBe(true);
    expect(shouldShowLoadReminder('2026-11-06', s, true)).toBe(false);
  });

  it('pospone viernes a sábado y sábado a domingo', () => {
    const friday = postponeLoadReminder('2026-11-06', INITIAL_WEEKLY_LOAD_REMINDER);
    expect(shouldShowLoadReminder('2026-11-06', friday, false)).toBe(false);
    expect(shouldShowLoadReminder('2026-11-07', friday, false)).toBe(true);
    const saturday = postponeLoadReminder('2026-11-07', friday);
    expect(shouldShowLoadReminder('2026-11-07', saturday, false)).toBe(false);
    expect(shouldShowLoadReminder('2026-11-08', saturday, false)).toBe(true);
    const sunday = postponeLoadReminder('2026-11-08', saturday);
    expect(shouldShowLoadReminder('2026-11-08', sunday, false)).toBe(false);
    expect(sunday.snoozedUntil).toBe('2026-11-13');
  });

  it('borrar lo apaga para siempre', () => {
    const dismissed = dismissLoadReminder(INITIAL_WEEKLY_LOAD_REMINDER);
    expect(shouldShowLoadReminder('2026-11-13', dismissed, false)).toBe(false);
  });
});
