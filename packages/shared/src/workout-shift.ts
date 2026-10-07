export type WorkoutShift = 'early' | 'late';

export function workoutShift(performedDate: string, originDate: string | null | undefined): WorkoutShift | null {
  if (!originDate) return null;
  const performed = performedDate.slice(0, 10);
  const origin = originDate.slice(0, 10);
  if (performed === origin) return null;
  return performed < origin ? 'early' : 'late';
}

export function weekdayName(date: string, locale: string): string {
  const value = new Date(`${date.slice(0, 10)}T12:00:00`);
  return value.toLocaleDateString(locale, { weekday: 'long' });
}
