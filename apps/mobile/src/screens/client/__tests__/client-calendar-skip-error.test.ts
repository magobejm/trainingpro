import { ApiClientError } from '../../../data/api-client';
import { refreshCalendarOnSkipConflict, sessionSkipErrorKey } from '../../../data/client-session-skip-error';

describe('calendar skip conflicts', () => {
  it('refreshes a stale calendar after the server rejects a changed session', () => {
    const refresh = jest.fn();
    const error = new ApiClientError('Session already started', 409);
    refreshCalendarOnSkipConflict(error, refresh);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(sessionSkipErrorKey(error)).toBe('client.calendar.workout.changed');
  });
  it('keeps the current calendar and explains a recoverable network failure', () => {
    const refresh = jest.fn();
    const error = new Error('Network failed');
    refreshCalendarOnSkipConflict(error, refresh);
    expect(refresh).not.toHaveBeenCalled();
    expect(sessionSkipErrorKey(error)).toBe('client.calendar.workout.saveError');
  });
});
