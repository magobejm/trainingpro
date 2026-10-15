import { sessionOutcome } from '../session-outcome';

describe('sessionOutcome', () => {
  it('treats an unfinished closed session as incomplete before done', () => {
    expect(sessionOutcome({ isCompleted: true, isIncomplete: true, status: 'COMPLETED' })).toBe('incomplete');
  });

  it('keeps a finished session done and a running one in progress', () => {
    expect(sessionOutcome({ isCompleted: true, isIncomplete: false, status: 'COMPLETED' })).toBe('done');
    expect(sessionOutcome({ isCompleted: false, isIncomplete: false, status: 'IN_PROGRESS' })).toBe('in_progress');
  });

  it('marks a session that was never started as skipped only while the reason stands', () => {
    expect(
      sessionOutcome({ isCompleted: false, isIncomplete: false, skippedAt: '2026-10-15T10:00:00.000Z', status: 'PENDING' }),
    ).toBe('skipped');
    expect(sessionOutcome({ isCompleted: false, isIncomplete: false, skippedAt: null, status: 'PENDING' })).toBe('pending');
  });
});
