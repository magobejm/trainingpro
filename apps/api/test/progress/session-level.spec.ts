import {
  positiveOrNull,
  resolveDurationMinutes,
  sessionLoadFromRpe,
} from '../../src/modules/progress/domain/metrics/session-level';
import { computeSessionSrpe } from '../../src/modules/progress/domain/metrics/srpe';

describe('session level metrics', () => {
  test('uses the start and end marks when they are valid', () => {
    const startedAt = new Date('2026-11-19T10:00:00.000Z');
    const finishedAt = new Date('2026-11-19T10:30:00.000Z');
    expect(resolveDurationMinutes(startedAt, finishedAt, 60)).toBe(30);
  });

  test('falls back to the performed duration when the marks are missing or equal', () => {
    const mark = new Date('2026-11-19T10:00:00.000Z');
    expect(resolveDurationMinutes(null, null, 228)).toBe(4);
    expect(resolveDurationMinutes(mark, mark, 228)).toBe(4);
    expect(resolveDurationMinutes(null, null, null)).toBeNull();
    expect(resolveDurationMinutes(null, null, 0)).toBeNull();
  });

  test('computes the session load from the session rpe and minutes', () => {
    expect(sessionLoadFromRpe(7.5, 4)).toBe(30);
    expect(sessionLoadFromRpe(null, 4)).toBeNull();
    expect(sessionLoadFromRpe(7.5, null)).toBeNull();
    expect(sessionLoadFromRpe(0, 4)).toBeNull();
  });

  test('matches the weekly sRPE formula', () => {
    expect(sessionLoadFromRpe(7.5, 4)).toBe(computeSessionSrpe(7.5, 240));
  });

  test('positiveOrNull keeps only positive numbers', () => {
    expect(positiveOrNull(3)).toBe(3);
    expect(positiveOrNull(0)).toBeNull();
    expect(positiveOrNull(undefined)).toBeNull();
  });
});
