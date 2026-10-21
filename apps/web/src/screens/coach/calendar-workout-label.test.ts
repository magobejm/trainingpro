import { it, expect } from 'vitest';
import { workoutStatusLines } from './calendar-workout-label';
import type { CalendarEventData } from './calendar-screen.types';
const event = (row: Partial<CalendarEventData>) =>
  ({ type: 'workout', date: '2026-10-19', outcome: 'pending', ...row }) as CalendarEventData;
it('keeps overdue pending distinct from skipped', () => {
  expect(workoutStatusLines(event({}), (key) => key, 'es', '2026-10-20')).toEqual([
    'training.outcome.pending',
    'training.overdue',
  ]);
  expect(workoutStatusLines(event({ outcome: 'skipped' }), (key) => key, 'es', '2026-10-20')).toEqual([
    'coach.calendar.workout.skipped',
  ]);
});
it('keeps the original date marker for an incomplete moved workout', () => {
  expect(
    workoutStatusLines(event({ outcome: 'incomplete', originDate: '2026-10-18' }), (key) => key, 'es', '2026-10-20'),
  ).toHaveLength(2);
});
