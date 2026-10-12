import { describe, expect, it } from 'vitest';
import { readCopy } from './async-status.copy';

const t = (key: string): string => key;

describe('readCopy', () => {
  it('uses the generic copy for a failure', () => {
    expect(readCopy({ emptyTitle: 'empty', kind: 'server' }, t)).toEqual({
      action: 'coach.status.retry',
      message: 'coach.status.server.message',
      title: 'coach.status.server.title',
    });
  });

  it('lets a screen override the title and message of a failure but keeps the retry action', () => {
    const copy = readCopy(
      { emptyTitle: 'empty', kind: 'network', messageOverride: 'custom message', titleOverride: 'custom title' },
      t,
    );
    expect(copy).toEqual({ action: 'coach.status.retry', message: 'custom message', title: 'custom title' });
  });

  it('ignores overrides on non-failure states', () => {
    const copy = readCopy({ emptyTitle: 'Nothing yet', kind: 'empty', titleOverride: 'custom title' }, t);
    expect(copy.title).toBe('Nothing yet');
  });

  it('asks the user to sign in again when the session expired', () => {
    expect(readCopy({ emptyTitle: 'empty', kind: 'sessionExpired' }, t).action).toBe('coach.status.signIn');
  });
});
