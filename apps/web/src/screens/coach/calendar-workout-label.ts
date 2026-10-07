import { weekdayName, workoutShift } from '@trainerpro/shared';
import type { CalendarEventData } from './calendar-screen.types';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function workoutStatusLines(event: CalendarEventData, t: Translate, locale: string): string[] {
  if (event.type !== 'workout' || !event.isCompleted) return [];
  const performed = (event.date instanceof Date ? event.date.toISOString() : String(event.date)).slice(0, 10);
  const lines = [t('coach.calendar.workout.done')];
  const shift = workoutShift(performed, event.originDate);
  if (shift && event.originDate) {
    lines.push(t(`coach.calendar.workout.${shift}`, { day: weekdayName(event.originDate, locale) }));
  }
  return lines;
}
