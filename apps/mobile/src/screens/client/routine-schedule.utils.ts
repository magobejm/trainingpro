import type { ClientRoutineDay } from '../../data/hooks/useClientRoutineQuery';
import type { ClientCalendarEvent } from '../../data/hooks/useClientCalendar';

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekDateRange(date: Date): { from: string; to: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { from: formatLocalDate(start), to: formatLocalDate(end) };
}

export type ScheduledWorkout = {
  date: string;
  planDayId: string;
  routineDay: ClientRoutineDay | null;
  title: string;
};

export type RoutineWeekSchedule =
  | {
      mode: 'assigned';
      days: ClientRoutineDay[];
    }
  | {
      isRestDay: boolean;
      mode: 'calendar';
      otherDays: ScheduledWorkout[];
      today: ScheduledWorkout | null;
    };

function resolveWorkoutTitle(event: ClientCalendarEvent): string {
  return event.planDayTitle ?? event.title ?? '—';
}

const DAY_INDEX_TITLE = /\b(?:d[ií]a|day)\s*(\d+)\b/i;

function parseDayIndexFromCalendarTitle(title: string): number | null {
  const match = title.trim().match(DAY_INDEX_TITLE);
  if (!match?.[1]) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function resolvePlanDayFromCalendarEvent(event: ClientCalendarEvent, planDays: ClientRoutineDay[]): ClientRoutineDay | null {
  if (event.planDayId) {
    const byId = planDays.find((day) => day.id === event.planDayId);
    if (byId) return byId;
  }

  const title = resolveWorkoutTitle(event).trim();
  if (!title || title === '—') return null;

  const exact = planDays.find((day) => day.title === title);
  if (exact) return exact;

  const partial = planDays.find((day) => title.includes(day.title) || day.title.includes(title));
  if (partial) return partial;

  const dayIndex = parseDayIndexFromCalendarTitle(title);
  if (dayIndex != null) {
    const byIndex = planDays.find((day) => day.dayIndex === dayIndex);
    if (byIndex) return byIndex;
  }

  return null;
}

function buildScheduledWorkout(event: ClientCalendarEvent, planDays: ClientRoutineDay[]): ScheduledWorkout {
  const title = resolveWorkoutTitle(event);
  const matchedDay = resolvePlanDayFromCalendarEvent(event, planDays);

  return {
    date: event.date.slice(0, 10),
    planDayId: matchedDay?.id ?? event.planDayId ?? '',
    routineDay: matchedDay,
    title,
  };
}

function listWeekWorkouts(
  calendarEvents: ClientCalendarEvent[],
  planDays: ClientRoutineDay[],
  date: Date,
): ScheduledWorkout[] {
  const { from, to } = getWeekDateRange(date);
  const seenDates = new Set<string>();
  const workouts: ScheduledWorkout[] = [];

  for (const event of calendarEvents) {
    if (event.type !== 'workout') continue;
    const eventDate = event.date.slice(0, 10);
    if (eventDate < from || eventDate > to || seenDates.has(eventDate)) continue;
    seenDates.add(eventDate);
    workouts.push(buildScheduledWorkout(event, planDays));
  }

  return workouts.sort((a, b) => a.date.localeCompare(b.date));
}

export function resolveRoutineWeekSchedule(
  planDays: ClientRoutineDay[],
  calendarEvents: ClientCalendarEvent[],
  date: Date,
): RoutineWeekSchedule {
  const weekWorkouts = listWeekWorkouts(calendarEvents, planDays, date);
  if (weekWorkouts.length === 0) {
    return { mode: 'assigned', days: planDays };
  }

  const todayStr = formatLocalDate(date);
  const today = weekWorkouts.find((workout) => workout.date === todayStr) ?? null;

  return {
    isRestDay: today == null,
    mode: 'calendar',
    otherDays: weekWorkouts.filter((workout) => workout.date !== todayStr),
    today,
  };
}

export function scheduledWorkoutToRoutineDay(workout: ScheduledWorkout): ClientRoutineDay {
  if (workout.routineDay) return workout.routineDay;
  return {
    dayIndex: 0,
    exercises: [],
    id: workout.planDayId,
    notes: null,
    title: workout.title,
  };
}

export function formatScheduledDateLabel(dateStr: string, locale = 'es-ES'): string {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric' });
}

export function isSelectedPlanDayScheduledForToday(
  selectedPlanDayId: string,
  schedule: RoutineWeekSchedule | null,
): boolean {
  if (!schedule || schedule.mode === 'assigned') {
    return true;
  }
  if (!schedule.today) {
    return false;
  }
  const todayPlanDayId = schedule.today.planDayId || schedule.today.routineDay?.id || '';
  return todayPlanDayId === selectedPlanDayId;
}

/** @deprecated Use resolveRoutineWeekSchedule */
export function resolvePlanDayForDate(
  planDays: ClientRoutineDay[],
  calendarEvents: ClientCalendarEvent[],
  date: Date,
): ClientRoutineDay | null {
  const schedule = resolveRoutineWeekSchedule(planDays, calendarEvents, date);
  if (schedule.mode === 'assigned') {
    return planDays[0] ?? null;
  }
  if (schedule.today) {
    return scheduledWorkoutToRoutineDay(schedule.today);
  }
  return null;
}
