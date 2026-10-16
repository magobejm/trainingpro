import { ApiClientError } from './api-client';

export function refreshCalendarOnSkipConflict(error: unknown, refresh: () => void): void {
  if (error instanceof ApiClientError && error.status === 409) refresh();
}
export function sessionSkipErrorKey(error: unknown): string {
  return error instanceof ApiClientError && error.status === 409
    ? 'client.calendar.workout.changed'
    : 'client.calendar.workout.saveError';
}
