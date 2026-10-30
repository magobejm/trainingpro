import { describe, expect, it } from 'vitest';
import { isDayEditable, microcycleIndex, microcycleStart, weekLock } from './client-routine-lock';

const base = { cycleDays: 7, startsOn: '2026-10-05' };

describe('microcycles', () => {
  it('counts cycles from the routine start', () => {
    expect(microcycleIndex('2026-10-05', '2026-10-05', 7)).toBe(0);
    expect(microcycleIndex('2026-10-05', '2026-10-11', 7)).toBe(0);
    expect(microcycleIndex('2026-10-05', '2026-10-12', 7)).toBe(1);
    expect(microcycleStart('2026-10-05', 2, 7)).toBe('2026-10-19');
  });
});

describe('weekLock', () => {
  it('locks a week whose window has ended', () => {
    const lock = weekLock({ ...base, days: [{ dayIndex: 1 }], today: '2026-10-20' });
    expect(lock.phase).toBe('completed');
    expect(lock.readOnly).toBe(true);
  });

  it('locks a week once every planned day is closed, even inside its window', () => {
    const lock = weekLock({
      ...base,
      days: [
        { dayIndex: 1, outcome: 'done' },
        { dayIndex: 2, outcome: 'skipped' },
      ],
      today: '2026-10-07',
    });
    expect(lock.phase).toBe('completed');
  });

  it('keeps pending days editable inside the current week', () => {
    const lock = weekLock({
      ...base,
      days: [{ dayIndex: 1, outcome: 'done' }, { dayIndex: 2, outcome: 'pending' }, { dayIndex: 3 }],
      today: '2026-10-07',
    });
    expect(lock.phase).toBe('current');
    expect(lock.lockedDays).toEqual([1]);
    expect(isDayEditable(lock, 1)).toBe(false);
    expect(isDayEditable(lock, 2)).toBe(true);
    expect(isDayEditable(lock, 3)).toBe(true);
  });

  it('freezes a day that was started', () => {
    const lock = weekLock({ ...base, days: [{ dayIndex: 1, outcome: 'in_progress' }], today: '2026-10-06' });
    expect(isDayEditable(lock, 1)).toBe(false);
  });

  it('leaves a future week fully editable', () => {
    const lock = weekLock({ ...base, days: [{ dayIndex: 1 }, { dayIndex: 2 }], today: '2026-09-30' });
    expect(lock.phase).toBe('future');
    expect(isDayEditable(lock, 1)).toBe(true);
  });
});
