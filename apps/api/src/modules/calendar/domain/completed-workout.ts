import { sessionOutcome, sessionOutcomeRank, type SessionOutcome } from '@trainerpro/shared';

export type WorkoutMark = {
  outcome: SessionOutcome;
  sessionId: string | null;
  skipReason: string | null;
};

export type SessionOutcomeRow = {
  clientId: string;
  id: string;
  isCompleted: boolean;
  isIncomplete: boolean;
  planDayId: string | null;
  sessionDate: Date;
  skipReason: string | null;
  skippedAt: Date | null;
  status: string;
};

export function completedDayKey(clientId: string | null, date: Date): string {
  return `${clientId ?? ''}|${date.toISOString().slice(0, 10)}`;
}

export function completedWorkoutKey(clientId: string | null, date: Date, planDayId: string): string {
  return `${completedDayKey(clientId, date)}|${planDayId}`;
}

export function rememberCompletedSession(keys: Set<string>, clientId: string, date: Date, planDayId: string | null): void {
  keys.add(completedDayKey(clientId, date));
  if (planDayId) keys.add(completedWorkoutKey(clientId, date, planDayId));
}

/** Un entrenamiento con día de plan solo está hecho si esa sesión concreta lo está. Sin día de plan, basta el día. */
export function isWorkoutCompleted(
  keys: Set<string>,
  clientId: string | null,
  date: Date,
  planDayId: string | null,
): boolean {
  if (planDayId) return keys.has(completedWorkoutKey(clientId, date, planDayId));
  return keys.has(completedDayKey(clientId, date));
}

export function indexSessionOutcomes(rows: SessionOutcomeRow[]): {
  done: Set<string>;
  marks: Map<string, WorkoutMark>;
} {
  const done = new Set<string>();
  const marks = new Map<string, WorkoutMark>();
  for (const row of rows) rememberIndexedSession(done, marks, row);
  return { done, marks };
}

export function readWorkoutMark(
  marks: Map<string, WorkoutMark>,
  clientId: string | null,
  date: Date,
  planDayId: string | null,
): WorkoutMark | null {
  const key = planDayId ? completedWorkoutKey(clientId, date, planDayId) : completedDayKey(clientId, date);
  return marks.get(key) ?? null;
}

export function workoutEventFields(mark: WorkoutMark | null): {
  isCompleted: boolean;
  outcome: SessionOutcome;
  sessionId: string | null;
  skipReason: string | null;
} {
  return {
    isCompleted: mark?.outcome === 'done',
    outcome: mark?.outcome ?? 'pending',
    sessionId: mark?.sessionId ?? null,
    skipReason: mark?.skipReason ?? null,
  };
}

function rememberIndexedSession(done: Set<string>, marks: Map<string, WorkoutMark>, row: SessionOutcomeRow): void {
  const outcome = sessionOutcome(row);
  const mark = { outcome, sessionId: row.id, skipReason: row.skipReason };
  if (row.planDayId) putMark(marks, completedWorkoutKey(row.clientId, row.sessionDate, row.planDayId), mark);
  putMark(marks, completedDayKey(row.clientId, row.sessionDate), mark);
  if (outcome === 'done') rememberCompletedSession(done, row.clientId, row.sessionDate, row.planDayId);
}

function putMark(marks: Map<string, WorkoutMark>, key: string, mark: WorkoutMark): void {
  const current = marks.get(key);
  if (
    !current ||
    sessionOutcomeRank(mark.outcome) > sessionOutcomeRank(current.outcome) ||
    (sessionOutcomeRank(mark.outcome) === sessionOutcomeRank(current.outcome) &&
      (mark.sessionId ?? '') > (current.sessionId ?? ''))
  )
    marks.set(key, mark);
}
