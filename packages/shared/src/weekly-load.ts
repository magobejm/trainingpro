/**
 * Carga laboral, mental o sentimental de la semana siguiente: fechas y recordatorio de los viernes.
 * Todo trabaja con claves de fecha locales `YYYY-MM-DD` para no depender de la zona horaria.
 */

export type WeeklyLoadReminderState = {
  /** Con `true` el recordatorio no vuelve a salir. */
  dismissed: boolean;
  /** Fecha local hasta la que está pospuesto (no se muestra antes). */
  snoozedUntil: string | null;
};

export const WEEKLY_LOAD_MAX_CHARS = 2000;

const DAY_MS = 86_400_000;

function toUtc(dateKey: string): number {
  return Date.parse(`${dateKey}T00:00:00.000Z`);
}

function toKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** 0 = lunes … 6 = domingo. */
function weekdayIndex(dateKey: string): number {
  return (new Date(toUtc(dateKey)).getUTCDay() + 6) % 7;
}

export function addDaysToKey(dateKey: string, days: number): string {
  return toKey(toUtc(dateKey) + days * DAY_MS);
}

export function mondayOfKey(dateKey: string): string {
  return addDaysToKey(dateKey, -weekdayIndex(dateKey));
}

/** Lunes de la semana siguiente: lo escrito desde el propio lunes ya cuenta para la semana que viene. */
export function nextWeekStart(todayKey: string): string {
  return addDaysToKey(mondayOfKey(todayKey), 7);
}

export function isMondayKey(dateKey: string): boolean {
  return weekdayIndex(dateKey) === 0;
}

function nextFriday(todayKey: string): string {
  const diff = (4 - weekdayIndex(todayKey) + 7) % 7;
  return addDaysToKey(todayKey, diff === 0 ? 7 : diff);
}

export const INITIAL_WEEKLY_LOAD_REMINDER: WeeklyLoadReminderState = { dismissed: false, snoozedUntil: null };

/** El recordatorio sale viernes, sábado y domingo mientras no haya nota, ni se haya borrado o pospuesto. */
export function shouldShowLoadReminder(
  todayKey: string,
  state: WeeklyLoadReminderState,
  hasNoteForNextWeek: boolean,
): boolean {
  if (state.dismissed || hasNoteForNextWeek) return false;
  if (weekdayIndex(todayKey) < 4) return false;
  return state.snoozedUntil === null || todayKey >= state.snoozedUntil;
}

/** Viernes pasa al sábado, sábado al domingo y el domingo al viernes siguiente. */
export function postponeLoadReminder(todayKey: string, state: WeeklyLoadReminderState): WeeklyLoadReminderState {
  const index = weekdayIndex(todayKey);
  const snoozedUntil = index >= 6 ? nextFriday(todayKey) : addDaysToKey(todayKey, 1);
  return { ...state, snoozedUntil };
}

export function dismissLoadReminder(state: WeeklyLoadReminderState): WeeklyLoadReminderState {
  return { ...state, dismissed: true };
}
