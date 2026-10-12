import { remainingSeconds, rewindEndAt, workoutElapsedMs } from '../countdown';

const HOUR_MS = 60 * 60 * 1000;

describe('remainingSeconds', () => {
  const endAt = 1_000_000;

  it('keeps the remaining time between zero and the planned total', () => {
    expect(remainingSeconds(endAt, 60, endAt - 15_000)).toBe(15);
    expect(remainingSeconds(endAt, 60, endAt)).toBe(0);
    expect(remainingSeconds(endAt, 60, endAt - 120_000)).toBe(60);
  });

  it('ends the rest after a long background stay instead of restarting it', () => {
    expect(remainingSeconds(endAt, 60, endAt + 10 * 60 * 1000)).toBe(0);
  });
});

describe('rewindEndAt', () => {
  it('does not increase the remaining time when the clock moves backward', () => {
    const endAt = 1_000_000;
    const lastSeenAt = 970_000;
    const now = lastSeenAt - HOUR_MS;
    const adjusted = rewindEndAt(endAt, lastSeenAt, now);
    expect(remainingSeconds(adjusted, 60, now)).toBe(30);
  });

  it('leaves the end mark alone when the clock moves forward', () => {
    expect(rewindEndAt(1_000_000, 900_000, 950_000)).toBe(1_000_000);
  });
});

describe('workoutElapsedMs', () => {
  const startedAt = '2026-10-12T08:00:00.000Z';
  const start = new Date(startedAt).getTime();

  it('freezes on the finish mark once the session is completed', () => {
    const finishedAt = '2026-10-12T08:40:00.000Z';
    expect(workoutElapsedMs({ finishedAt, startedAt, status: 'COMPLETED' }, new Date(finishedAt).getTime() + HOUR_MS)).toBe(
      40 * 60 * 1000,
    );
  });

  it('never returns a negative duration', () => {
    expect(workoutElapsedMs({ finishedAt: null, startedAt, status: 'IN_PROGRESS' }, start - HOUR_MS)).toBe(0);
    expect(workoutElapsedMs({ finishedAt: null, startedAt: null, status: 'PENDING' }, start)).toBe(0);
  });
});
