import { ConflictException } from '@nestjs/common';
import { Prisma, SessionStatus } from '@prisma/client';
import { createOrReread } from '../../src/common/prisma/unique-violation';
import {
  finishIfOpen,
  sameFinish,
  shouldReplacePendingSession,
  type FinishComparable,
} from '../../src/modules/sessions/infra/prisma/session-concurrency';
import type { FinishSessionInput } from '../../src/modules/sessions/domain/session.input';

const input: FinishSessionInput = {
  comment: 'bien',
  isIncomplete: false,
  sessionId: 'session',
  sessionRpe: 7,
};

const completed: FinishComparable = {
  finishComment: 'bien',
  isIncomplete: false,
  postFatigue: null,
  postMood: null,
  postPain: null,
  sessionRpe: 7,
  status: SessionStatus.COMPLETED,
};

describe('session concurrency', () => {
  it('returns the session that won the unique client-date insert', async () => {
    const existing = { id: 'session-1' };
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });

    await expect(
      createOrReread(
        async () => {
          throw error;
        },
        async () => existing,
      ),
    ).resolves.toEqual(existing);
  });

  it('returns the closed session when the repeated finish matches', async () => {
    const open: FinishComparable = { ...completed, status: SessionStatus.IN_PROGRESS };
    await expect(
      finishIfOpen(
        open,
        input,
        async () => 0,
        async () => completed,
      ),
    ).resolves.toEqual(completed);
    expect(sameFinish(completed, input)).toBe(true);
  });

  it('rejects a later finish whose payload differs', async () => {
    const open: FinishComparable = { ...completed, status: SessionStatus.IN_PROGRESS };
    const other: FinishComparable = { ...completed, sessionRpe: 9 };
    await expect(
      finishIfOpen(
        open,
        input,
        async () => 0,
        async () => other,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('replaces a pending session only when the plan day changed and it has not started', () => {
    const pending = { planDayId: 'day-1', startedAt: null, status: SessionStatus.PENDING };
    expect(shouldReplacePendingSession(pending, 'day-2')).toBe(true);
    expect(shouldReplacePendingSession({ ...pending, startedAt: new Date() }, 'day-2')).toBe(false);
  });
});
