import { HIGH_PAIN_AT } from './thresholds';

export const LOW_CHECKIN_BELOW = 3;
export const ROUTINE_ENDING_DAYS = 14;
export const NO_WORKOUT_DAYS = 3;
export const WEEK_ADHERENCE_BELOW = 0.5;

export type LowCheckinField = 'motivation' | 'pain' | 'recovery' | 'sleep';

export function lowCheckinFields(input: {
  motivation: number;
  pain: number | null;
  recovery: number;
  sleep: number;
}): LowCheckinField[] {
  const fields: LowCheckinField[] = [];
  if (input.sleep < LOW_CHECKIN_BELOW) fields.push('sleep');
  if (input.motivation < LOW_CHECKIN_BELOW) fields.push('motivation');
  if (input.recovery < LOW_CHECKIN_BELOW) fields.push('recovery');
  if (input.pain != null && input.pain >= HIGH_PAIN_AT) fields.push('pain');
  return fields;
}

export function isLowMorningCheckin(input: Parameters<typeof lowCheckinFields>[0]): boolean {
  return lowCheckinFields(input).length > 0;
}

export type RoutineAlert = { daysLeft: number; kind: 'ending' } | { kind: 'noCalendar' } | { kind: 'noRoutine' };

/** `lastWorkoutDay` es el ultimo entreno del calendario desde hoy (yyyy-mm-dd) o null. */
export function routineAlert(input: {
  hasRoutine: boolean;
  lastWorkoutDay: null | string;
  today: string;
}): null | RoutineAlert {
  if (!input.hasRoutine) return { kind: 'noRoutine' };
  if (!input.lastWorkoutDay) return { kind: 'noCalendar' };
  const days = Math.round((Date.parse(input.lastWorkoutDay) - Date.parse(input.today)) / 86_400_000);
  return days <= ROUTINE_ENDING_DAYS ? { daysLeft: Math.max(days, 0), kind: 'ending' } : null;
}

export function isLowAdherence(input: { daysWithoutWorkout: null | number; weekAdherence: null | number }): boolean {
  if (input.weekAdherence != null && input.weekAdherence < WEEK_ADHERENCE_BELOW) return true;
  return input.daysWithoutWorkout != null && input.daysWithoutWorkout >= NO_WORKOUT_DAYS;
}
