import type { ExerciseHistoryEntry } from '@trainerpro/shared';
import type { SessionItem } from '../../../data/hooks/useTodaySession';
import { historyDraft, matchHistorySet, sourceOccurrence, targetDraft } from '../set-copy';

const strength = {
  id: 'squat-a',
  type: 'strength',
  lockedFields: [],
  sourceExerciseId: 'squat',
  plannedSets: [{ setIndex: 1, reps: 8, weightKg: 80, rpe: 8 }],
} as unknown as SessionItem;

function history(sets: ExerciseHistoryEntry['sets'], sessionDate = '2026-10-20'): ExerciseHistoryEntry {
  return { effortRir: null, effortRpe: null, repsDone: null, sessionDate, sessionId: sessionDate, sets, weightDoneKg: null };
}

it('copies the planned set as raw numbers', () => {
  expect(targetDraft(strength, 1)).toEqual({ reps: '8', rpe: '8', weight: '80' });
});

it('copies the matching set from the latest session', () => {
  const entries = [
    history([{ itemId: 'old', repsDone: 5, setIndex: 1, weightDoneKg: 70 }], '2026-10-01'),
    history([{ itemId: 'recent', repsDone: 6, setIndex: 1, weightDoneKg: 75, effortRpe: 9 }], '2026-10-20'),
  ];
  const set = matchHistorySet(entries, 1, 0);
  expect(set?.weightDoneKg).toBe(75);
  expect(historyDraft(strength, set!)).toMatchObject({ reps: '6', rpe: '9', weight: '75' });
});

it('returns nothing when that set was not logged', () => {
  const entries = [history([{ itemId: 'recent', repsDone: 6, setIndex: 1, weightDoneKg: 75 }])];
  expect(matchHistorySet(entries, 2, 0)).toBeNull();
});

it('uses the same occurrence when the exercise is repeated', () => {
  const second = { ...strength, id: 'squat-b' } as SessionItem;
  const entries = [
    history([
      { itemId: 'first', repsDone: 5, setIndex: 1, weightDoneKg: 60 },
      { itemId: 'second', repsDone: 8, setIndex: 1, weightDoneKg: 50 },
    ]),
  ];
  expect(sourceOccurrence([strength, second], second)).toBe(1);
  expect(matchHistorySet(entries, 1, 1)?.weightDoneKg).toBe(50);
});
