export type WorkoutClockSession = {
  finishedAt: string | null;
  startedAt: string | null;
  status: string;
};

export function remainingSeconds(endAt: number, totalSeconds: number, now: number): number {
  const total = Math.max(0, Math.floor(totalSeconds));
  const raw = Math.ceil((endAt - now) / 1000);
  if (raw <= 0) return 0;
  return Math.min(total, raw);
}

export function rewindEndAt(endAt: number, lastSeenAt: number, now: number): number {
  if (now >= lastSeenAt) return endAt;
  return endAt - (lastSeenAt - now);
}

export function workoutElapsedMs(session: WorkoutClockSession, now: number): number {
  const start = readTime(session.startedAt);
  if (start == null) return 0;
  if (session.status === 'COMPLETED') {
    const end = readTime(session.finishedAt);
    if (end == null) return 0;
    return Math.max(0, end - start);
  }
  return Math.max(0, now - start);
}

function readTime(value: string | null): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}
