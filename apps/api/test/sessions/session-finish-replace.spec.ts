import { SessionStatus } from '@prisma/client';
import type { FinishSessionInput } from '../../src/modules/sessions/domain/session.input';
import { isStaleAutoClose, takeStaleFinish } from '../../src/modules/sessions/infra/prisma/session-finish-replace';

const stale = {
  finishComment: null,
  isIncomplete: true,
  performedDurationSeconds: null,
  sessionRpe: null,
  status: SessionStatus.COMPLETED,
};

const input: FinishSessionInput = {
  finishedAt: new Date('2026-09-07T18:00:00.000Z'),
  isIncomplete: false,
  sessionId: 'session',
  sessionRpe: 7,
};

describe('stale auto close replacement', () => {
  it('recognises only an incomplete close without a client finish', () => {
    expect(isStaleAutoClose(stale)).toBe(true);
    expect(isStaleAutoClose({ ...stale, sessionRpe: 7 })).toBe(false);
    expect(isStaleAutoClose({ ...stale, finishComment: 'bien' })).toBe(false);
    expect(isStaleAutoClose({ ...stale, performedDurationSeconds: 90 })).toBe(false);
    expect(isStaleAutoClose({ ...stale, isIncomplete: false })).toBe(false);
    expect(isStaleAutoClose({ ...stale, status: SessionStatus.IN_PROGRESS })).toBe(false);
  });

  it('replaces the automatic close and leaves a real finish untouched', async () => {
    const update = jest.fn(async () => 1);
    const reload = jest.fn(async () => ({ id: 'session' }));
    await expect(takeStaleFinish(stale, input, update, reload)).resolves.toEqual({ id: 'session' });
    expect(update).toHaveBeenCalledTimes(1);

    const skipped = jest.fn(async () => 1);
    await expect(takeStaleFinish({ ...stale, sessionRpe: 8 }, input, skipped, reload)).resolves.toBeNull();
    expect(skipped).not.toHaveBeenCalled();
    await expect(takeStaleFinish(stale, { ...input, finishedAt: undefined }, skipped, reload)).resolves.toBeNull();
  });

  it('does not claim the row when a real finish won the update', async () => {
    await expect(
      takeStaleFinish(
        stale,
        input,
        async () => 0,
        async () => ({ id: 'session' }),
      ),
    ).resolves.toBeNull();
  });
});
