export type EarlyWorkoutEvent = {
  date: Date;
  id: string;
  isCompleted: boolean;
  planDayId: string | null;
  planDayTitle?: string | null;
  title: string | null;
  type: string;
};

/** Quita el pendiente posterior de la misma semana cuando ese día ya se hizo antes. */
export function withoutEarlyCompletedDuplicate<T extends EarlyWorkoutEvent>(events: T[]): T[] {
  const drop = new Set<string>();
  const workouts = events.filter((event) => event.type === 'workout');
  for (const done of workouts) {
    if (!done.isCompleted) continue;
    const name = workoutName(done);
    const doneDay = utcDay(done.date);
    const week = weekStart(doneDay);
    const later = workouts
      .filter((event) => {
        if (event.isCompleted || drop.has(event.id) || event.id === done.id) return false;
        const day = utcDay(event.date);
        if (weekStart(day) !== week || day <= doneDay) return false;
        if (done.planDayId && event.planDayId === done.planDayId) return true;
        const pendingName = workoutName(event);
        return Boolean(name) && pendingName === name;
      })
      .sort((left, right) => utcDay(left.date).localeCompare(utcDay(right.date)));
    const nearest = later[0];
    if (nearest) drop.add(nearest.id);
  }
  return events.filter((event) => !drop.has(event.id));
}

function workoutName(event: EarlyWorkoutEvent): string {
  return (event.planDayTitle ?? event.title ?? '').trim();
}

function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function weekStart(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  const utc = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, date ?? 1));
  utc.setUTCDate(utc.getUTCDate() - ((utc.getUTCDay() + 6) % 7));
  return utc.toISOString().slice(0, 10);
}
