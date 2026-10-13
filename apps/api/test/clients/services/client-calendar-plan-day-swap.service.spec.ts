import {
  chooseWorkoutPlacement,
  coachMoveMessage,
  originDateAfterMove,
  pendingSearchRange,
  pickNearestPending,
  utcDateKey,
} from '../../../src/modules/clients/application/services/client-calendar-plan-day-move';
import { ClientCalendarPlanDaySwapService } from '../../../src/modules/clients/application/services/client-calendar-plan-day-swap.service';
import { isWorkoutCompleted, rememberCompletedSession } from '../../../src/modules/calendar/domain/completed-workout';

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

  it('prefers explicit planDayId over title', () => {
    expect(
      service.resolveEventPlanDayId(
        { id: 'event-1', date: new Date('2026-09-08'), originDate: null, planDayId: 'day-1', title: 'Día 2' },
        planDays,
      ),
    ).toBe('day-1');
  });
});

describe('planned workout move', () => {
  const today = '2026-10-08';

  it('keeps the planned day when the workout moves, and drops it when it returns', () => {
    const thursday = new Date('2026-10-08T00:00:00.000Z');
    const wednesday = new Date('2026-10-07T00:00:00.000Z');
    expect(originDateAfterMove(thursday, wednesday, null)?.toISOString().slice(0, 10)).toBe('2026-10-08');
    expect(originDateAfterMove(thursday, thursday, null)).toBeNull();
  });

  it('searches four weeks before and after the session', () => {
    const range = pendingSearchRange(new Date('2026-10-08T00:00:00.000Z'));
    expect(utcDateKey(range.from)).toBe('2026-09-10');
    expect(utcDateKey(range.to)).toBe('2026-11-05');
  });

  it('picks the closest pending workout and prefers the past on a tie', () => {
    const events = [
      { date: new Date('2026-10-05T00:00:00.000Z'), id: 'three-back' },
      { date: new Date('2026-10-06T00:00:00.000Z'), id: 'two-back' },
      { date: new Date('2026-10-10T00:00:00.000Z'), id: 'two-ahead' },
      { date: new Date('2026-10-09T00:00:00.000Z'), id: 'one-ahead' },
    ];
    expect(pickNearestPending(events, today, (event) => event.id !== 'three-back')?.id).toBe('one-ahead');
    expect(pickNearestPending(events, today, (event) => event.id === 'two-back' || event.id === 'two-ahead')?.id).toBe(
      'two-back',
    );
  });

  it('does not move a workout that is already pending today', () => {
    const events = [
      { date: new Date('2026-10-06T00:00:00.000Z'), id: 'past' },
      { date: new Date('2026-10-08T00:00:00.000Z'), id: 'today' },
    ];
    expect(chooseWorkoutPlacement({ events, isPendingRequested: () => true, todayKey: today })).toEqual({ type: 'none' });
  });

  it('moves the nearest pending workout and ignores one already done', () => {
    const events = [
      { date: new Date('2026-10-06T00:00:00.000Z'), done: true, id: 'done' },
      { date: new Date('2026-10-11T00:00:00.000Z'), done: false, id: 'later' },
    ];
    expect(
      chooseWorkoutPlacement({
        events,
        isPendingRequested: (event) => !event.done,
        todayKey: today,
      }),
    ).toEqual({ sourceId: 'later', type: 'move' });
  });

  it('creates an unplanned entry when nothing pending is left', () => {
    expect(
      chooseWorkoutPlacement({
        events: [{ date: new Date('2026-10-06T00:00:00.000Z'), id: 'done' }],
        isPendingRequested: () => false,
        todayKey: today,
      }),
    ).toEqual({ type: 'create' });
  });

  it('tells the coach where the workout came from, or that the session was unplanned', () => {
    expect(coachMoveMessage({ fromDate: new Date('2026-10-06T00:00:00.000Z'), requestedTitle: 'Día 1' })).toContain(
      '6 de octubre',
    );
    expect(coachMoveMessage({ fromDate: null, requestedTitle: 'Día 1' })).toContain('registrado en el calendario');
  });
});

describe('completed workout keys', () => {
  it('marks only the plan day that was completed, and any untagged workout on that day', () => {
    const keys = new Set<string>();
    rememberCompletedSession(keys, 'client', new Date('2026-10-08T00:00:00.000Z'), 'day-1');
    const date = new Date('2026-10-08T00:00:00.000Z');
    expect(isWorkoutCompleted(keys, 'client', date, 'day-1')).toBe(true);
    expect(isWorkoutCompleted(keys, 'client', date, 'day-2')).toBe(false);
    expect(isWorkoutCompleted(keys, 'client', date, null)).toBe(true);
  });
});
