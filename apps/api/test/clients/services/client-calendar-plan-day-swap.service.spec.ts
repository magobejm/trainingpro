import {
  ClientCalendarPlanDaySwapService,
  originDateAfterMove,
  pickSourceEvent,
  startOfUtcWeekMonday,
  utcDateKey,
} from '../../../src/modules/clients/application/services/client-calendar-plan-day-swap.service';

describe('ClientCalendarPlanDaySwapService', () => {
  const planDays = [
    { dayIndex: 1, id: 'day-1', title: 'Día 1' },
    { dayIndex: 2, id: 'day-2', title: 'Día 2' },
  ];

  let service: ClientCalendarPlanDaySwapService;

  beforeEach(() => {
    service = new ClientCalendarPlanDaySwapService({} as never, {} as never);
  });

  it('resolves plan day id from calendar title when planDayId is null', () => {
    expect(
      service.resolveEventPlanDayId(
        { id: 'event-1', date: new Date('2026-09-08'), originDate: null, planDayId: null, title: 'Día 2' },
        planDays,
      ),
    ).toBe('day-2');
  });

  it('keeps the planned day when the workout moves, and drops it when it returns', () => {
    const thursday = new Date('2026-10-08T00:00:00.000Z');
    const wednesday = new Date('2026-10-07T00:00:00.000Z');
    expect(originDateAfterMove(thursday, wednesday, null)?.toISOString().slice(0, 10)).toBe('2026-10-08');
    expect(originDateAfterMove(thursday, thursday, null)).toBeNull();
  });

  it('keeps calendar dates on the UTC day sent by the client', () => {
    expect(utcDateKey(new Date('2026-10-08T00:00:00.000Z'))).toBe('2026-10-08');
    expect(startOfUtcWeekMonday(new Date('2026-10-11T00:00:00.000Z')).toISOString().slice(0, 10)).toBe('2026-10-05');
  });

  it('picks the next scheduled occurrence of the requested day, even outside this week', () => {
    const events = [
      { date: new Date('2026-10-05T00:00:00.000Z'), id: 'past' },
      { date: new Date('2026-10-15T00:00:00.000Z'), id: 'next-week' },
      { date: new Date('2026-10-22T00:00:00.000Z'), id: 'later' },
    ];
    expect(pickSourceEvent(events, '2026-10-08', (event) => event.id !== 'later')?.id).toBe('next-week');
    expect(pickSourceEvent(events, '2026-10-08', (event) => event.id === 'past')?.id).toBe('past');
  });

  it('prefers explicit planDayId over title', () => {
    expect(
      service.resolveEventPlanDayId(
        { id: 'event-1', date: new Date('2026-09-08'), originDate: null, planDayId: 'day-1', title: 'Día 2' },
        planDays,
      ),
    ).toBe('day-1');
  });
});
