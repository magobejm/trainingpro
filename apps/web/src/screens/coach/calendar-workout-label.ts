import { weekdayName, workoutShift } from '@trainerpro/shared';
import type { CalendarEventData } from './calendar-screen.types';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function workoutStatusLines(event: CalendarEventData, t: Translate, locale: string, today = localDay()): string[] {
  if (event.type !== 'workout') return [];
  const lines = statusLabel(event, t);
  const date = (event.date instanceof Date ? event.date.toISOString() : String(event.date)).slice(0, 10);
  if ((!event.outcome || event.outcome === 'pending') && !event.isCompleted && date < today)
    lines.push(t('training.overdue'));
  if (event.skipReason) lines.push(event.skipReason);
  if (event.outcome === 'done' || event.outcome === 'incomplete' || event.isCompleted)
    lines.push(...shiftLines(event, t, locale));
  return lines;
}

function statusLabel(event: CalendarEventData, t: Translate): string[] {
  if (event.outcome === 'incomplete') return [t('coach.calendar.workout.incomplete')];
  if (event.outcome === 'skipped') return [t('coach.calendar.workout.skipped')];
  if (event.outcome === 'done' || event.isCompleted) return [t('coach.calendar.workout.done')];
  return [t('training.outcome.' + (event.outcome ?? 'pending'))];
}

function shiftLines(event: CalendarEventData, t: Translate, locale: string): string[] {
  const performed = (event.date instanceof Date ? event.date.toISOString() : String(event.date)).slice(0, 10);
  const shift = workoutShift(performed, event.originDate);
  if (!shift || !event.originDate) return [];
  return [t(`coach.calendar.workout.${shift}`, { day: weekdayName(event.originDate, locale) })];
}

function localDay(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
