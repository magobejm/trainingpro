import type { ProgressRecord, SessionView } from '@trainerpro/shared';
import { buildWorkoutSummary, recordsForSession } from '../workout-summary';

const session = {
  items: [
    {
      logs: [
        { repsDone: 5, weightDoneKg: 80 },
        { repsDone: 5, weightDoneKg: 80 },
        { repsDone: null, weightDoneKg: 40 },
      ],
      setsPlanned: 3,
      type: 'strength',
    },
    { intervalLogs: [{}], roundsPlanned: 2, type: 'cardio' },
    { logs: [{ weightDoneKg: 20 }], setsPlanned: 1, type: 'isometric' },
  ],
  performedDurationSeconds: 1200,
  sessionRpe: 8,
} as unknown as SessionView;

it('sums lifted weight, completed sets and sRPE load', () => {
  expect(buildWorkoutSummary(session)).toEqual({
    durationSeconds: 1200,
    load: 160,
    setsDone: 5,
    setsPlanned: 6,
    tonnageKg: 800,
  });
});

it('uses the finish values when the session snapshot is still pending', () => {
  const pending = { ...session, performedDurationSeconds: null, sessionRpe: null } as SessionView;
  expect(buildWorkoutSummary(pending, { performedDurationSeconds: 600, sessionRpe: 6 }).load).toBe(60);
});

it('returns no tonnage when nothing was loaded', () => {
  const empty = {
    items: [{ intervalLogs: [], roundsPlanned: 1, type: 'cardio' }],
    sessionRpe: null,
  } as unknown as SessionView;
  expect(buildWorkoutSummary(empty).tonnageKg).toBe(0);
  expect(buildWorkoutSummary(empty).load).toBeNull();
});

it('keeps only the records from the finished session', () => {
  const records = [
    { e1rm: 100, exerciseId: 'a', exerciseName: 'Press', previousBest: 90, sessionDate: '2026-10-24', sessionId: 'today' },
    {
      e1rm: 80,
      exerciseId: 'b',
      exerciseName: 'Sentadilla',
      previousBest: null,
      sessionDate: '2026-10-24',
      sessionId: 'other',
    },
  ] as ProgressRecord[];
  expect(recordsForSession(records, 'today').map((record) => record.exerciseName)).toEqual(['Press']);
});
