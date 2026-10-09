import type { CalendarEventType, CallStatus } from './calendar-screen.types';

export type FixedCalendarColor = { bg: string; border: string; text: string };

export const COACH_NOTE_COLOR: FixedCalendarColor = { bg: '#172554', border: '#1e3a8a', text: '#dbeafe' };
export const CALL_COLOR: FixedCalendarColor = { bg: '#065f46', border: '#064e3b', text: '#d1fae5' };
export const PHYSICAL_TEST_COLOR: FixedCalendarColor = { bg: '#312e81', border: '#1e1b4b', text: '#e0e7ff' };

const FIXED_BY_TYPE: Partial<Record<CalendarEventType, FixedCalendarColor>> = {
  call: CALL_COLOR,
  note: COACH_NOTE_COLOR,
  physical_test: PHYSICAL_TEST_COLOR,
  reminder: CALL_COLOR,
};

/** Notas y llamadas usan un color fijo; los entrenos conservan el color elegido. */
export function fixedColorFor(type: CalendarEventType): FixedCalendarColor | null {
  return FIXED_BY_TYPE[type] ?? null;
}

export function callStatusLabelKey(status: CallStatus | undefined): string | null {
  if (status === 'pending') return 'coach.calendar.call.pending';
  if (status === 'unconfirmed') return 'coach.calendar.call.unconfirmed';
  return null;
}
