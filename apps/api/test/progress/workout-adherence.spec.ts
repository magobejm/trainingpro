import { adherenceCutoff, calculateWorkoutAdherence } from '../../src/common/plan/workout-adherence';
import type { ScheduledWorkout, WorkoutSession } from '@trainerpro/shared';

const event = (id: string, date = '2026-10-01'): ScheduledWorkout => ({ id, date, clientId: 'c', planDayId: id });
const session = (id: string, extra: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id,
  clientId: 'c',
  sessionDate: '2026-10-01',
  planDayId: id,
  status: 'COMPLETED',
  isCompleted: true,
  isIncomplete: false,
  ...extra,
});

describe('agenda adherence', () => {
  it('counts only done in the numerator and keeps incomplete, skipped and pending in the denominator', () => {
    const result = calculateWorkoutAdherence(
      [event('a'), event('b'), event('c'), event('d')],
      [
        session('a'),
        session('b', { isIncomplete: true }),
        session('c', { isCompleted: false, status: 'PENDING', skippedAt: '2026-10-01T12:00:00Z' }),
      ],
      '2026-10-01',
      '2026-10-01',
      '2026-10-01',
    );
    expect(result.percent).toBe(25);
    expect(result.plannedCount).toBe(4);
    expect(result.counts).toEqual({ done: 1, incomplete: 1, skipped: 1, pending: 1, in_progress: 0 });
  });
  it('uses moved dates once, excludes today and does not inflate adherence with unplanned sessions', () => {
    const moved = { ...event('a', '2026-10-02'), originDate: '2026-10-01' };
    const result = calculateWorkoutAdherence(
      [moved, event('today', '2026-10-03')],
      [session('a', { sessionDate: '2026-10-02' }), session('extra')],
      '2026-10-01',
      '2026-10-03',
      '2026-10-02',
    );
    expect(result.plannedCount).toBe(1);
    expect(result.percent).toBe(100);
    expect(result.unplannedSessionsCount).toBe(1);
  });
  it('returns unknown adherence without registered agenda', () => {
    const result = calculateWorkoutAdherence([], [session('a')], '2026-10-01', '2026-10-01', '2026-10-01');
    expect(result.percent).toBeNull();
    expect(result.unplannedSessionsCount).toBe(1);
  });
  it('deduplicates repeated planned rows without counting a session twice', () => {
    const result = calculateWorkoutAdherence(
      [event('a'), { ...event('a'), id: 'copy' }],
      [session('a')],
      '2026-10-01',
      '2026-10-01',
      '2026-10-01',
    );
    expect(result.plannedCount).toBe(1);
    expect(result.counts.done).toBe(1);
  });
  it('uses the caller local day only for the cutoff, never converting the session date', () => {
    const now = new Date('2026-10-01T22:30:00Z');
    expect(adherenceCutoff('2026-10-10', now, 120)).toBe('2026-10-01');
    expect(adherenceCutoff('2026-10-10', now, 0)).toBe('2026-09-30');
    expect(adherenceCutoff('2026-09-01', now, 120)).toBe('2026-09-01');
  });
  it('does not turn an ambiguous legacy session into a completed workout when filtering one template', () => {
    const a = event('a');
    const b = event('b');
    const legacy = session('legacy', { planDayId: null });
    const result = calculateWorkoutAdherence([a], [legacy], '2026-10-01', '2026-10-01', '2026-10-01', [a, b], [legacy]);
    expect(result.counts.done).toBe(0);
    expect(result.counts.pending).toBe(1);
  });
  it('does not count older attempts of the same unambiguous legacy workout as unplanned sessions', () => {
    const result = calculateWorkoutAdherence(
      [event('a')],
      [session('old', { planDayId: null }), session('new', { planDayId: null })],
      '2026-10-01',
      '2026-10-01',
      '2026-10-01',
    );
    expect(result.plannedCount).toBe(1);
    expect(result.unplannedSessionsCount).toBe(0);
  });
});
