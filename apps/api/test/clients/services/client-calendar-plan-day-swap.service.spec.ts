import { ClientCalendarPlanDaySwapService } from '../../../src/modules/clients/application/services/client-calendar-plan-day-swap.service';

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
        { id: 'event-1', date: new Date('2026-09-08'), planDayId: null, title: 'Día 2' },
        planDays,
      ),
    ).toBe('day-2');
  });

  it('prefers explicit planDayId over title', () => {
    expect(
      service.resolveEventPlanDayId(
        { id: 'event-1', date: new Date('2026-09-08'), planDayId: 'day-1', title: 'Día 2' },
        planDays,
      ),
    ).toBe('day-1');
  });
});
