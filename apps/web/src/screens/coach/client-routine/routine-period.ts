/** A seven-day microcycle is shown as a week. Any other length stays a microcycle. */
export function isWeekPeriod(cycleDays: number): boolean {
  return cycleDays === 7;
}
