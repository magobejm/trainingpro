import { withoutEarlyCompletedDuplicate } from '../../src/modules/calendar/domain/early-completed-workout';

describe('withoutEarlyCompletedDuplicate', () => {
  const workout = (overrides: Record<string, unknown>) => ({
    date: new Date('2026-11-06T00:00:00.000Z'),
    id: 'friday',
    isCompleted: false,
    planDayId: 'day-4',
    planDayTitle: 'Fullbody 3',
    title: 'Fullbody 3',
    type: 'workout',
    ...overrides,
  });

  it('drops the later pending copy in the same week when that day was already done', () => {
    const events = [
      workout({
        date: new Date('2026-11-02T00:00:00.000Z'),
        id: 'monday',
        isCompleted: true,
      }),
      workout({ id: 'friday' }),
      workout({
        date: new Date('2026-11-05T00:00:00.000Z'),
        id: 'thursday',
        planDayId: 'day-2',
        planDayTitle: 'Fullbody 2',
        title: 'Fullbody 2',
      }),
    ];

    expect(withoutEarlyCompletedDuplicate(events).map((event) => event.id)).toEqual(['monday', 'thursday']);
  });

  it('keeps the same day next week', () => {
    const events = [
      workout({ date: new Date('2026-11-02T00:00:00.000Z'), id: 'monday', isCompleted: true }),
      workout({ date: new Date('2026-11-13T00:00:00.000Z'), id: 'next-friday' }),
    ];

    expect(withoutEarlyCompletedDuplicate(events).map((event) => event.id)).toEqual(['monday', 'next-friday']);
  });
});
