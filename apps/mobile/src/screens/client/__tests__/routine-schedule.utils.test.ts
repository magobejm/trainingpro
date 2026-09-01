import type { ClientRoutineDay } from '../../../data/hooks/useClientRoutineQuery';
import type { ClientCalendarEvent } from '../../../data/hooks/useClientCalendar';
import {
  formatLocalDate,
  formatScheduledDateLabel,
  getWeekDateRange,
  resolveRoutineWeekSchedule,
  scheduledWorkoutToRoutineDay,
} from '../routine-schedule.utils';

describe('routine-schedule.utils', () => {
  const planDays: ClientRoutineDay[] = [
    {
      dayIndex: 1,
      exercises: [{ displayName: 'Squat', id: 'ex-1', sortOrder: 0 } as ClientRoutineDay['exercises'][number]],
      id: 'day-1',
      notes: null,
      title: 'Day 1 - Lower Body',
    },
    {
      dayIndex: 2,
      exercises: [],
      id: 'day-2',
      notes: null,
      title: 'Day 2 - Upper Body',
    },
  ];

  const calendarEvent = (overrides: Partial<ClientCalendarEvent>): ClientCalendarEvent => ({
    color: null,
    content: null,
    date: '2026-09-01',
    id: 'event-1',
    planDayId: 'day-1',
    planDayTitle: 'Day 1 - Lower Body',
    time: null,
    title: 'Day 1 - Lower Body',
    type: 'workout',
    ...overrides,
  });

  it('formats local dates without UTC drift', () => {
    expect(formatLocalDate(new Date(2026, 8, 1))).toBe('2026-09-01');
  });

  it('builds monday-sunday week ranges', () => {
    expect(getWeekDateRange(new Date(2026, 8, 1))).toEqual({
      from: '2026-08-31',
      to: '2026-09-06',
    });
  });

  it('uses calendar workouts for today and other days in the same week', () => {
    const schedule = resolveRoutineWeekSchedule(
      planDays,
      [
        calendarEvent({ date: '2026-09-01', id: 'today', planDayId: 'legacy-day', planDayTitle: 'Legacy Day 2' }),
        calendarEvent({ date: '2026-09-03', id: 'other', planDayId: 'day-2', planDayTitle: 'Day 2 - Upper Body' }),
      ],
      new Date(2026, 8, 1),
    );

    expect(schedule.mode).toBe('calendar');
    if (schedule.mode !== 'calendar') return;
    expect(schedule.today?.planDayId).toBe('legacy-day');
    expect(schedule.today?.title).toBe('Legacy Day 2');
    expect(schedule.isRestDay).toBe(false);
    expect(schedule.otherDays).toHaveLength(1);
    expect(schedule.otherDays[0]?.planDayId).toBe('day-2');
  });

  it('marks rest days when the week has workouts but not today', () => {
    const schedule = resolveRoutineWeekSchedule(
      planDays,
      [calendarEvent({ date: '2026-09-03', id: 'other', planDayId: 'day-2' })],
      new Date(2026, 8, 1),
    );

    expect(schedule.mode).toBe('calendar');
    if (schedule.mode !== 'calendar') return;
    expect(schedule.isRestDay).toBe(true);
    expect(schedule.today).toBeNull();
  });

  it('falls back to the assigned routine when the week has no calendar workouts', () => {
    const schedule = resolveRoutineWeekSchedule(planDays, [], new Date(2026, 8, 1));
    expect(schedule).toEqual({ mode: 'assigned', days: planDays });
  });

  it('builds a preview day from calendar data when the plan day is outside the assigned routine', () => {
    const workout = scheduledWorkoutToRoutineDay({
      date: '2026-09-01',
      planDayId: 'legacy-day',
      routineDay: null,
      title: 'Legacy Day 2',
    });

    expect(workout.id).toBe('legacy-day');
    expect(workout.title).toBe('Legacy Day 2');
    expect(workout.exercises).toEqual([]);
  });

  it('formats scheduled date labels', () => {
    expect(formatScheduledDateLabel('2026-09-03', 'es-ES')).toContain('3');
  });
});
