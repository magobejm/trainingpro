import type { SessionOutcome } from './session-outcome';

const DAY_MS = 86_400_000;

export type WeekPhase = 'completed' | 'current' | 'future';

export type PlannedDay = {
  /** Day of the week copy, as in the routine (`dayIndex`). */
  dayIndex: number;
  /** Outcome of the session logged for that day, or undefined when none exists yet. */
  outcome?: SessionOutcome;
};

export type WeekLock = {
  phase: WeekPhase;
  /** True when nothing in the week can be edited. */
  readOnly: boolean;
  /** Day indexes that can no longer be edited. */
  lockedDays: number[];
};

function dayNumber(date: string): number {
  return Math.floor(new Date(`${date.slice(0, 10)}T00:00:00Z`).getTime() / DAY_MS);
}

export function isoDate(dayNumberValue: number): string {
  return new Date(dayNumberValue * DAY_MS).toISOString().slice(0, 10);
}

/** Microcycle number (0-based) a date falls in, counting from the routine start. */
export function microcycleIndex(cycleStartsOn: string, date: string, cycleDays: number): number {
  return Math.floor((dayNumber(date) - dayNumber(cycleStartsOn)) / Math.max(1, cycleDays));
}

export function microcycleStart(cycleStartsOn: string, index: number, cycleDays: number): string {
  return isoDate(dayNumber(cycleStartsOn) + index * Math.max(1, cycleDays));
}

/** A day is read-only once its session is finished, incomplete or skipped. A started one is also frozen. */
export function isDayLocked(outcome: SessionOutcome | undefined): boolean {
  return outcome !== undefined && outcome !== 'pending';
}

export function weekLock(input: { cycleDays: number; days: PlannedDay[]; startsOn: string; today: string }): WeekLock {
  const first = dayNumber(input.startsOn);
  const last = first + Math.max(1, input.cycleDays) - 1;
  const today = dayNumber(input.today);
  const lockedDays = input.days.filter((day) => isDayLocked(day.outcome)).map((day) => day.dayIndex);
  const allClosed = input.days.length > 0 && lockedDays.length === input.days.length;
  const phase: WeekPhase = allClosed || today > last ? 'completed' : today >= first ? 'current' : 'future';
  return { phase, readOnly: phase === 'completed', lockedDays };
}

/** True when an edit to the given day of this week must be rejected. */
export function isDayEditable(lock: WeekLock, dayIndex: number): boolean {
  return !lock.readOnly && !lock.lockedDays.includes(dayIndex);
}
