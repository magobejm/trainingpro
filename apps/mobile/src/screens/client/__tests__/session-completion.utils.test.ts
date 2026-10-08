/* eslint-disable max-lines-per-function */
import type { SessionItem } from '../../../data/hooks/useTodaySession';
import { formatRestLabel, isListedExerciseDone, isSessionItemComplete } from '../session-completion.utils';

describe('session-completion.utils', () => {
  const strengthComplete: SessionItem = {
    type: 'strength',
    coachInstructions: null,
    groupId: null,
    groupType: null,
    id: 's1',
    displayName: 'Press',
    logs: [
      {
        effortRir: 2,
        effortRpe: 8,
        repsDone: 8,
        restSecondsDone: null,
        sessionItemId: 's1',
        setIndex: 1,
        weightDoneKg: 60,
      },
    ],
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

  it('requires unique set indexes for strength completion', () => {
    expect(
      isSessionItemComplete({
        ...strengthComplete,
        logs: [
          { ...strengthComplete.logs[0]!, setIndex: 1 },
          { ...strengthComplete.logs[0]!, setIndex: 1 },
        ],
        setsPlanned: 2,
      }),
    ).toBe(false);
    expect(
      isSessionItemComplete({
        ...strengthComplete,
        logs: [
          { ...strengthComplete.logs[0]!, setIndex: 1 },
          { ...strengthComplete.logs[0]!, setIndex: 2 },
        ],
        setsPlanned: 2,
      }),
    ).toBe(true);
  });

  it('shows the done badge when the client finishes the exercise from the list', () => {
    const unfinished = { ...strengthComplete, logs: [], setsPlanned: 3 };
    expect(isListedExerciseDone(unfinished, undefined)).toBe(false);
    expect(isListedExerciseDone(unfinished, new Set())).toBe(false);
    expect(isListedExerciseDone(unfinished, new Set(['other']))).toBe(false);
    expect(isListedExerciseDone(unfinished, new Set(['s1']))).toBe(true);
    expect(isListedExerciseDone(strengthComplete, new Set())).toBe(true);
  });

  it('formats rest labels in seconds, never years', () => {
    expect(formatRestLabel(13)).toBe('13 seg');
    expect(formatRestLabel(14)).toBe('14 seg');
    expect(formatRestLabel(15)).toBe('15 seg');
    expect(formatRestLabel(45)).toBe('45 seg');
    expect(formatRestLabel(60)).toBe('60 seg');
    expect(formatRestLabel(90)).toBe('90 seg');
    expect(formatRestLabel(13)).not.toMatch(/año/i);
    expect(formatRestLabel(90)).not.toMatch(/año/i);
  });

  it('counts sport completion from per-set logs', () => {
    const sport: SessionItem = {
      type: 'sport',
      coachInstructions: null,
      groupId: null,
      groupType: null,
      id: 'sp1',
      displayName: 'Fútbol',
      durationMinutes: 20,
      log: null,
      notes: null,
      plannedSets: [
        { advancedTechnique: null, note: null, setIndex: 1 },
        { advancedTechnique: null, note: null, setIndex: 2 },
      ],
      setLogs: [
        {
          durationSecondsDone: 90,
          effortRir: null,
          effortRpe: 7,
          heartRateDone: null,
          hrMaxPctDone: null,
          hrReservePctDone: null,
          repsDone: 10,
          restSecondsDone: null,
          romDone: null,
          sessionSportBlockId: 'sp1',
          setIndex: 1,
          weightDoneKg: null,
        },
      ],
      sortOrder: 1,
      targetRpe: 7,
    };
    expect(isSessionItemComplete(sport)).toBe(false);
    expect(
      isSessionItemComplete({
        ...sport,
        setLogs: [
          { ...sport.setLogs[0]!, setIndex: 1 },
          { ...sport.setLogs[0]!, setIndex: 2 },
        ],
      }),
    ).toBe(true);
  });
});
