export type ClearableCalendarEvent = {
  id: string;
  type: string;
  date: string;
  clientId: string | null;
};

export function calendarDayKey(clientId: string | null, day: string): string {
  return `${clientId ?? ''}|${day.slice(0, 10)}`;
}

export function parseCalendarDay(day: string): Date {
  return new Date(`${day.slice(0, 10)}T00:00:00.000Z`);
}

/** Workouts on or after `from` that have no completed session that day. */
export function selectWorkoutIdsToClear(
  events: ClearableCalendarEvent[],
  completedDayKeys: ReadonlySet<string>,
  from: string,
): string[] {
  return events.filter((event) => shouldClearWorkout(event, completedDayKeys, from)).map((event) => event.id);
}

function shouldClearWorkout(event: ClearableCalendarEvent, completedDayKeys: ReadonlySet<string>, from: string): boolean {
  if (event.type !== 'workout' || !event.clientId) return false;
  const day = event.date.slice(0, 10);
  if (day < from) return false;
  return !completedDayKeys.has(calendarDayKey(event.clientId, day));
}
