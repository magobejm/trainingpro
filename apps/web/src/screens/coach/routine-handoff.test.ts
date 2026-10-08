import { describe, expect, it, vi } from 'vitest';
import { chooseRoutineHandoff, hasPendingWorkoutFromToday } from './routine-handoff';

const today = '2026-10-08';

describe('hasPendingWorkoutFromToday', () => {
  it('ignores notes, past workouts and a completed day', () => {
    expect(
      hasPendingWorkoutFromToday(
        [
          { type: 'note', date: '2026-10-20' },
          { type: 'workout', date: '2026-10-01', isCompleted: false },
          { type: 'workout', date: '2026-10-08', isCompleted: true },
        ],
        today,
      ),
    ).toBe(false);
  });
});

describe('chooseRoutineHandoff', () => {
  it('asks and replaces when another routine still has a pending workout', async () => {
    const ask = vi.fn().mockResolvedValue('replace');
    const outcome = await chooseRoutineHandoff({
      ask,
      hasOtherRoutine: true,
      loadPending: async () => [{ type: 'workout', date: '2026-10-15', isCompleted: false }],
      sameRoutine: false,
      today,
    });
    expect(outcome).toBe('replace');
    expect(ask).toHaveBeenCalledOnce();
  });

  it('assigns without asking when nothing is planned ahead', async () => {
    const ask = vi.fn();
    const outcome = await chooseRoutineHandoff({
      ask,
      hasOtherRoutine: true,
      loadPending: async () => [{ type: 'workout', date: '2026-10-01', isCompleted: false }],
      sameRoutine: false,
      today,
    });
    expect(outcome).toBe('assign');
    expect(ask).not.toHaveBeenCalled();
  });

  it('cancels without assigning', async () => {
    const outcome = await chooseRoutineHandoff({
      ask: async () => 'cancel',
      hasOtherRoutine: true,
      loadPending: async () => [{ type: 'workout', date: '2026-10-15' }],
      sameRoutine: false,
      today,
    });
    expect(outcome).toBe('cancel');
  });

  it('keeps the same routine without asking', async () => {
    const ask = vi.fn();
    const outcome = await chooseRoutineHandoff({
      ask,
      hasOtherRoutine: true,
      loadPending: async () => [{ type: 'workout', date: '2026-10-15' }],
      sameRoutine: true,
      today,
    });
    expect(outcome).toBe('same');
    expect(ask).not.toHaveBeenCalled();
  });
});
