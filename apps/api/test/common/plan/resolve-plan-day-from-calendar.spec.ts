import {
  findPlanDayFromCalendarEvent,
  parseDayIndexFromCalendarTitle,
  resolvePlanDayIdFromCalendarEvent,
} from '../../../src/common/plan/resolve-plan-day-from-calendar';

describe('resolve-plan-day-from-calendar', () => {
  const planDays = [
    { dayIndex: 1, id: 'day-1', title: 'Pata' },
    { dayIndex: 2, id: 'day-2', title: 'Día 2' },
  ];

  it('parses day index from calendar titles', () => {
    expect(parseDayIndexFromCalendarTitle('Día 1')).toBe(1);
    expect(parseDayIndexFromCalendarTitle('Day 2 - Lower Focus')).toBe(2);
  });

  it('matches generic calendar titles to renamed plan days by day index', () => {
    expect(resolvePlanDayIdFromCalendarEvent({ planDayId: null, title: 'Día 1' }, planDays)).toBe('day-1');
  });

  it('prefers explicit planDayId when it still exists', () => {
    expect(resolvePlanDayIdFromCalendarEvent({ planDayId: 'day-2', title: 'Día 1' }, planDays)).toBe('day-2');
  });

  it('finds the full plan day reference', () => {
    expect(findPlanDayFromCalendarEvent({ planDayId: null, title: 'Día 1' }, planDays)?.title).toBe('Pata');
  });
});
