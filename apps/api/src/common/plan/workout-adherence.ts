import {
  hasClosedSessionResult,
  resolveWorkoutResults,
  sessionDateKey,
  type ScheduledWorkout,
  type SessionOutcome,
  type WorkoutSession,
} from '@trainerpro/shared';

export type AdherenceSummary = {
  from: string;
  to: string;
  cutoffDate: string;
  percent: number | null;
  plannedCount: number;
  counts: Record<SessionOutcome, number>;
  unplannedSessionsCount: number;
};

export function calculateWorkoutAdherence(
  events: ScheduledWorkout[],
  sessions: WorkoutSession[],
  from: string,
  to: string,
  cutoffDate: string,
  contextEvents = events,
  contextSessions = sessions,
): AdherenceSummary {
  const inRange = (date: Date | string): boolean => {
    const key = sessionDateKey(date);
    return key >= from && key <= to && key <= cutoffDate;
  };
  const unique = new Map<string, ScheduledWorkout>();
  for (const event of [...events].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!inRange(event.date)) continue;
    const key = `${event.clientId}|${sessionDateKey(event.date)}|${event.planDayId ?? `event:${event.id}`}`;
    if (!unique.has(key)) unique.set(key, event);
  }
  const selected = [...unique.values()];
  const resolved = resolveWorkoutResults(
    contextEvents.filter((event) => inRange(event.date)),
    contextSessions,
  );
  const counts: Record<SessionOutcome, number> = { done: 0, incomplete: 0, skipped: 0, pending: 0, in_progress: 0 };
  const matched = new Set<string>();
  for (const event of selected) {
    const result = resolved.get(event.id);
    counts[result?.outcome ?? 'pending']++;
    if (result?.sessionId) matched.add(result.sessionId);
  }
  const unplannedSessionsCount = sessions.filter((session) => {
    if (!inRange(session.sessionDate) || !hasClosedSessionResult(session) || matched.has(session.id)) return false;
    if (
      contextSessions.some(
        (chosen) =>
          matched.has(chosen.id) &&
          chosen.clientId === session.clientId &&
          chosen.planDayId === session.planDayId &&
          sessionDateKey(chosen.sessionDate) === sessionDateKey(session.sessionDate),
      )
    )
      return false;
    // Older duplicate attempts belonging to the same scheduled workout are not extras.
    return !selected.some(
      (event) =>
        event.clientId === session.clientId &&
        event.planDayId !== null &&
        event.planDayId === session.planDayId &&
        sessionDateKey(event.date) === sessionDateKey(session.sessionDate),
    );
  }).length;
  return {
    from,
    to,
    cutoffDate,
    percent: selected.length ? Math.round((counts.done / selected.length) * 10000) / 100 : null,
    plannedCount: selected.length,
    counts,
    unplannedSessionsCount,
  };
}

export function adherenceCutoff(to: string, now = new Date(), timezoneOffset = 0): string {
  const yesterday = new Date(now.getTime() + timezoneOffset * 60_000 - 86_400_000).toISOString().slice(0, 10);
  return to < yesterday ? to : yesterday;
}
