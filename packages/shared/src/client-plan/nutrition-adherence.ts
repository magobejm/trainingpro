export type MealLogStatus = 'CHANGED' | 'DONE' | 'SKIPPED';

export type AdherenceCounts = {
  changed: number;
  done: number;
  expected: number;
  percent: number | null;
  skipped: number;
};

export function countAdherence(expected: number, statuses: MealLogStatus[]): AdherenceCounts {
  const done = statuses.filter((status) => status === 'DONE').length;
  const changed = statuses.filter((status) => status === 'CHANGED').length;
  const skipped = statuses.filter((status) => status === 'SKIPPED').length;
  const met = done + changed;
  return {
    changed,
    done,
    expected,
    percent: expected > 0 ? Math.round((met / expected) * 100) : null,
    skipped,
  };
}

export function eachPlanDate(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${from}T12:00:00.000Z`);
  const end = new Date(`${to}T12:00:00.000Z`);
  while (cursor.getTime() <= end.getTime() && dates.length < 62) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function planCalendarDate(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

/** Days before the plan copy was assigned do not count as planned meals. */
export function expectedMealsOnDate(assignedAt: Date, date: string, mealCount: number): number {
  return date < calendarDateKey(assignedAt) ? 0 : mealCount;
}

export function calendarDateKey(value: Date): string {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}
