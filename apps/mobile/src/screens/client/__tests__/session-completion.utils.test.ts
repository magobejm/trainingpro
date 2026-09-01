import type { SessionItem } from '../../../data/hooks/useTodaySession';
import { formatRestLabel, isSessionItemComplete } from '../session-completion.utils';

describe('session-completion.utils', () => {
  const strengthComplete: SessionItem = {
    type: 'strength',
    coachInstructions: null,
    groupId: null,
    groupType: null,
    id: 's1',
    displayName: 'Press',
    logs: [{ effortRir: 2, effortRpe: 8, repsDone: 8, sessionItemId: 's1', setIndex: 1, weightDoneKg: 60 }],
    notes: null,
    plannedSets: [],
    repsMax: 8,
    repsMin: 8,
    restSeconds: 90,
    setsPlanned: 1,
    sortOrder: 1,
    sourceExerciseId: null,
    targetRir: 2,
    targetRpe: 8,
    weightRangeMaxKg: 60,
    weightRangeMinKg: 60,
  };

  it('detects completed strength items', () => {
    expect(isSessionItemComplete(strengthComplete)).toBe(true);
    expect(isSessionItemComplete({ ...strengthComplete, logs: [], setsPlanned: 2 })).toBe(false);
  });

  it('formats rest labels', () => {
    expect(formatRestLabel(45)).toBe('45s');
    expect(formatRestLabel(60)).toBe('1m');
    expect(formatRestLabel(90)).toBe('1m 30s');
  });
});
