import { resolveWorkoutResults, type ScheduledWorkout, type WorkoutSession } from '../workout-results';

const event = (id: string, planDayId: string | null): ScheduledWorkout => ({
  id,
  planDayId,
  clientId: 'c',
  date: '2026-10-01',
});
const session = (id: string, planDayId: string | null, extra: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id,
  planDayId,
  clientId: 'c',
  sessionDate: '2026-10-01',
  isCompleted: true,
  isIncomplete: false,
  status: 'COMPLETED',
  ...extra,
});

describe('scheduled workout results', () => {
  it('does not apply a completed session to another workout on the same day', () => {
    const results = resolveWorkoutResults([event('a', 'day-a'), event('b', 'day-b')], [session('s', 'day-a')]);
    expect(results.get('a')?.outcome).toBe('done');
    expect(results.get('b')?.outcome).toBe('pending');
  });
  it('keeps incomplete ahead of the legacy completed flag', () => {
    expect(
      resolveWorkoutResults([event('a', 'day-a')], [session('s', 'day-a', { isIncomplete: true })]).get('a')?.outcome,
    ).toBe('incomplete');
  });
  it('uses day-only legacy sessions only with a single unambiguous workout', () => {
    expect(resolveWorkoutResults([event('a', 'day-a')], [session('s', null)]).get('a')?.sessionId).toBe('s');
    const results = resolveWorkoutResults([event('a', 'day-a'), event('b', 'day-b')], [session('s', null)]);
    expect([...results.values()].every((result) => result.sessionId === null)).toBe(true);
  });
  it('does not reuse an exact session for a separate unlinked calendar event', () => {
    const results = resolveWorkoutResults([event('a', 'day-a'), event('b', null)], [session('s', 'day-a')]);
    expect(results.get('a')?.sessionId).toBe('s');
    expect(results.get('b')?.sessionId).toBeNull();
  });
  it('selects duplicate attempts deterministically regardless of read order', () => {
    const sessions = [
      session('old', 'day-a', { updatedAt: '2026-10-01T09:00:00Z' }),
      session('new', 'day-a', { updatedAt: '2026-10-01T10:00:00Z' }),
    ];
    const first = resolveWorkoutResults([event('a', 'day-a')], sessions).get('a');
    expect(first?.sessionId).toBe('new');
    expect(resolveWorkoutResults([event('a', 'day-a')], [...sessions].reverse()).get('a')).toEqual(first);
  });
});
