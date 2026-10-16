import { partitionRoutineWorkouts } from '../routine-handoff';

const event = (id: string, date = '2026-10-16', planDayId: string | null = id) => ({
  id,
  date,
  planDayId,
  type: 'workout',
  title: id,
  updatedAt: '2026-10-16T00:00:00Z',
});
const session = (planDayId: string | null, status: string, extra = {}) => ({
  id: planDayId ?? 'legacy',
  planDayId,
  date: '2026-10-16',
  status,
  startedAt: null,
  isCompleted: false,
  isIncomplete: false,
  ...extra,
});

describe('routine handoff selection', () => {
  it('protects only the matching workout, including incomplete sessions', () => {
    const result = partitionRoutineWorkouts(
      [event('pending'), event('started'), event('done'), event('incomplete')],
      [
        session('started', 'IN_PROGRESS'),
        session('done', 'COMPLETED'),
        session('incomplete', 'COMPLETED', { isIncomplete: true }),
      ],
      '2026-10-16',
    );
    expect(result.removable.map((row) => row.id)).toEqual(['pending']);
    expect(result.preserved.map((row) => row.reason)).toEqual(['completed', 'incomplete', 'started']);
  });

  it('includes the entire future, ignores past/non-workouts and leaves skipped pending sessions removable', () => {
    const result = partitionRoutineWorkouts(
      [event('past', '2026-10-15'), event('future', '2035-01-01'), event('pending'), { ...event('note'), type: 'note' }],
      [session('pending', 'PENDING')],
      '2026-10-16',
    );
    expect(result.removable.map((row) => row.id)).toEqual(['pending', 'future']);
    expect(result.preserved).toEqual([]);
  });

  it('uses day fallback only for calendar events without a plan day', () => {
    const result = partitionRoutineWorkouts(
      [event('specific'), event('legacy', '2026-10-16', null)],
      [session('other', 'IN_PROGRESS')],
      '2026-10-16',
    );
    expect(result.removable.map((row) => row.id)).toEqual(['specific']);
    expect(result.preserved.map((row) => row.id)).toEqual(['legacy']);
  });

  it('protects a pending status with a recorded start and supports an empty calendar', () => {
    expect(
      partitionRoutineWorkouts([event('started')], [session('started', 'PENDING', { startedAt: 'now' })], '2026-10-16')
        .preserved,
    ).toHaveLength(1);
    expect(partitionRoutineWorkouts([], [], '2026-10-16')).toEqual({ removable: [], preserved: [] });
  });
});
