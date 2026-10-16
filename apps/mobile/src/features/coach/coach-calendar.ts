export function localCoachDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function shiftCoachDate(value: string, days: number): string {
  const date = new Date(value + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return localCoachDate(date);
}
export function shiftCoachMonth(value: string, months: number): string {
  const date = new Date(value + 'T12:00:00');
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, last));
  return localCoachDate(date);
}
export function isCoachDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && localCoachDate(new Date(value + 'T12:00:00')) === value;
}
export function coachMonthDays(value: string): string[] {
  const date = new Date(value + 'T12:00:00');
  date.setDate(1);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => shiftCoachDate(localCoachDate(date), i));
}
export function coachRange(days = 90) {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - days);
  return { from: from.toISOString(), to: to.toISOString() };
}
