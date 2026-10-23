import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma, SessionStatus } from '@prisma/client';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import { DiscardSessionUseCase } from '../../src/modules/sessions/application/use-cases/discard-session.usecase';
import { discardOpenSession } from '../../src/modules/sessions/infra/prisma/session-discard';

const context = { activeRole: 'client', roles: ['client'], subject: 'user' } as AuthContext;

describe('discardOpenSession', () => {
  it('deletes the recorded set and returns an in-progress workout to pending', async () => {
    const calls: DbCall[] = [];
    await discardOpenSession(fakeDb(calls), context, session(SessionStatus.IN_PROGRESS, { logs: [{ id: 'set-1' }] }));
    expect(calls.map((call) => `${call.model}.${call.op}`)).toEqual([
      'setLog.deleteMany',
      'intervalLog.deleteMany',
      'plioSetLog.deleteMany',
      'mobilitySetLog.deleteMany',
      'isometricSetLog.deleteMany',
      'sportSessionLog.deleteMany',
      'sportSetLog.deleteMany',
      'sessionCardioBlock.updateMany',
      'sessionInstance.updateMany',
    ]);
    expect(calls.at(-1)?.args).toEqual({
      data: expect.objectContaining({
        isCompleted: false,
        isIncomplete: false,
        performedDurationSeconds: null,
        sessionRpe: null,
        startedAt: null,
        status: SessionStatus.PENDING,
        updatedBy: 'user',
      }),
      where: { archivedAt: null, id: 'session-1', status: { not: SessionStatus.COMPLETED } },
    });
  });

  it('rejects a completed workout without deleting its records', async () => {
    const calls: DbCall[] = [];
    await expect(discardOpenSession(fakeDb(calls), context, session(SessionStatus.COMPLETED))).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(calls).toEqual([]);
  });

  it('leaves a pending workout without records unchanged', async () => {
    const calls: DbCall[] = [];
    await discardOpenSession(fakeDb(calls), context, session(SessionStatus.PENDING));
    expect(calls).toEqual([]);
  });

  it('rejects when the workout is completed before the reset is saved', async () => {
    const calls: DbCall[] = [];
    const db = fakeDb(calls, 0);
    await expect(discardOpenSession(db, context, session(SessionStatus.IN_PROGRESS))).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('DiscardSessionUseCase', () => {
  it('discards only after access is granted', async () => {
    const discardSession = jest.fn().mockResolvedValue({ id: 'session-1' });
    const assertCanAccess = jest.fn();
    const useCase = new DiscardSessionUseCase({ discardSession } as never, { assertCanAccess } as never);
    await expect(useCase.execute(context, 'session-1')).resolves.toEqual({ id: 'session-1' });
    expect(assertCanAccess).toHaveBeenCalledWith(context, 'session-1');
    expect(discardSession).toHaveBeenCalledWith(context, 'session-1');
  });

  it('does not discard when access is denied', async () => {
    const discardSession = jest.fn();
    const useCase = new DiscardSessionUseCase(
      { discardSession } as never,
      {
        assertCanAccess: async () => {
          throw new ForbiddenException();
        },
      } as never,
    );
    await expect(useCase.execute(context, 'session-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(discardSession).not.toHaveBeenCalled();
  });
});

type DbCall = { args: unknown; model: string; op: string };

function session(status: SessionStatus, item: { logs: unknown[] } = { logs: [] }) {
  return {
    cardioBlocks: [{ distanceDoneMeters: null, intervalLogs: [] }],
    id: 'session-1',
    isometricBlocks: [{ logs: [] }],
    items: [item],
    mobilityBlocks: [{ logs: [] }],
    plioBlocks: [{ logs: [] }],
    sportBlocks: [{ logs: [], setLogs: [] }],
    startedAt: status === SessionStatus.PENDING ? null : new Date('2026-10-23T08:00:00.000Z'),
    status,
  };
}

function fakeDb(calls: DbCall[], updated = 1): Prisma.TransactionClient {
  const model = (name: string) => ({
    deleteMany: async (args: unknown) => {
      calls.push({ args, model: name, op: 'deleteMany' });
      return { count: 1 };
    },
    updateMany: async (args: unknown) => {
      calls.push({ args, model: name, op: 'updateMany' });
      return { count: name === 'sessionInstance' ? updated : 1 };
    },
  });
  return {
    intervalLog: model('intervalLog'),
    isometricSetLog: model('isometricSetLog'),
    mobilitySetLog: model('mobilitySetLog'),
    plioSetLog: model('plioSetLog'),
    sessionCardioBlock: model('sessionCardioBlock'),
    sessionInstance: model('sessionInstance'),
    setLog: model('setLog'),
    sportSessionLog: model('sportSessionLog'),
    sportSetLog: model('sportSetLog'),
  } as unknown as Prisma.TransactionClient;
}
