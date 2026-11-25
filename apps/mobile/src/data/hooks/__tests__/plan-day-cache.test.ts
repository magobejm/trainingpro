import { planDayMapFromCache } from '../useClientRoutineQuery';
import type { ClientRoutineDay } from '@trainerpro/shared';

const day = { dayIndex: 1, exercises: [], id: 'day-1', notes: null, title: 'Pata' } satisfies ClientRoutineDay;

describe('planDayMapFromCache', () => {
  it('reads a persisted entry list and ignores a Map that was saved as an empty object', () => {
    expect(planDayMapFromCache([['2026-11-24|day-1', day]]).get('2026-11-24|day-1')?.title).toBe('Pata');
    expect(planDayMapFromCache({}).size).toBe(0);
    expect(planDayMapFromCache(undefined).size).toBe(0);
  });
});
