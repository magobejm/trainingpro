import { sessionOutcome, type SessionOutcome } from './session-outcome';

export type ScheduledWorkout = {
  id: string;
  clientId: string | null;
  date: Date | string;
  planDayId: string | null;
  originDate?: Date | string | null;
};

export type WorkoutSession = {
  id: string;
  clientId: string;
  sessionDate: Date | string;
  planDayId: string | null;
  isCompleted: boolean;
  isIncomplete: boolean;
  status: string;
  skippedAt?: Date | string | null;
  skipReason?: string | null;
  updatedAt?: Date | string;
};

export type WorkoutResult = {
  outcome: SessionOutcome;
  sessionId: string | null;
  skipReason: string | null;
};

export function resolveWorkoutResults(events: ScheduledWorkout[], sessions: WorkoutSession[]): Map<string, WorkoutResult> {
  const results = new Map<string, WorkoutResult>();
  const dayEvents = new Map<string, Set<string>>();
  const daySessions = new Map<string, WorkoutSession[]>();
  for (const event of events) {
    const day = `${event.clientId}|${sessionDateKey(event.date)}`;
    const keys = dayEvents.get(day) ?? new Set<string>();
    keys.add(event.planDayId ?? `event:${event.id}`);
    dayEvents.set(day, keys);
  }
  for (const session of sessions) {
    const day = `${session.clientId}|${sessionDateKey(session.sessionDate)}`;
    const rows = daySessions.get(day) ?? [];
    rows.push(session);
    daySessions.set(day, rows);
  }
  for (const event of events) {
    const day = `${event.clientId}|${sessionDateKey(event.date)}`;
    const rows = daySessions.get(day) ?? [];
    let candidates = event.planDayId ? rows.filter((row) => row.planDayId === event.planDayId) : [];
    if (!candidates.length && dayEvents.get(day)?.size === 1) {
      if (event.planDayId) candidates = rows.filter((row) => row.planDayId === null);
      else if (new Set(rows.map((row) => row.planDayId).filter(Boolean)).size <= 1) candidates = rows;
    }
    const chosen = [...candidates].sort(compareSessions)[0];
    results.set(
      event.id,
      chosen
        ? {
            outcome: sessionOutcome(chosen),
            sessionId: chosen.id,
            skipReason: chosen.skipReason ?? null,
          }
        : { outcome: 'pending', sessionId: null, skipReason: null },
    );
  }
  return results;
}

function compareSessions(left: WorkoutSession, right: WorkoutSession): number {
  const rank = sessionOutcomeRank(sessionOutcome(right)) - sessionOutcomeRank(sessionOutcome(left));
  if (rank) return rank;
  const timestamp = (row: WorkoutSession): string =>
    row.updatedAt instanceof Date ? row.updatedAt.toISOString() : (row.updatedAt ?? '');
  return timestamp(right).localeCompare(timestamp(left)) || right.id.localeCompare(left.id);
}

export function sessionDateKey(date: Date | string): string {
  return (date instanceof Date ? date.toISOString() : date).slice(0, 10);
}

export function sessionOutcomeRank(outcome: SessionOutcome): number {
  return { done: 4, incomplete: 3, in_progress: 2, skipped: 1, pending: 0 }[outcome];
}

export function hasClosedSessionResult(row: Parameters<typeof sessionOutcome>[0]): boolean {
  const outcome = sessionOutcome(row);
  return outcome === 'done' || outcome === 'incomplete';
}
