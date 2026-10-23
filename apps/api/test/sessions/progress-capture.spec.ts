import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import type { SessionsRepositoryPort } from '../../src/modules/sessions/domain/sessions-repository.port';
import { SessionsCardioRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions-cardio.repository.prisma';
import { LogCardioDistanceUseCase } from '../../src/modules/sessions/application/use-cases/log-cardio-distance.usecase';
import { SessionAccessPolicy } from '../../src/modules/sessions/domain/policies/session-access.policy';
import { EditWindowPolicy } from '../../src/modules/sessions/domain/policies/edit-window.policy';
import { CardioDistanceDto } from '../../src/modules/sessions/presentation/dto/cardio-distance.dto';
import { LogIntervalDto } from '../../src/modules/sessions/presentation/dto/log-interval.dto';
import { FinishSessionDto } from '../../src/modules/sessions/presentation/dto/finish-session.dto';

describe('progress capture contracts', () => {
  it('retains heart-rate percentages in a cardio interval', () => {
    const parsed = LogIntervalDto.schema.parse({
      sessionCardioBlockId: '00000000-0000-4000-8000-000000000001',
      intervalIndex: 1,
      hrMaxPctDone: 82.5,
      hrReservePctDone: 63,
    });
    expect(parsed).toMatchObject({ hrMaxPctDone: 82.5, hrReservePctDone: 63 });
  });
  it('retains frozen duration and rejects negative durations', () => {
    expect(FinishSessionDto.schema.parse({ isIncomplete: false, performedDurationSeconds: 0 })).toMatchObject({
      performedDurationSeconds: 0,
    });
    expect(FinishSessionDto.schema.safeParse({ isIncomplete: false, performedDurationSeconds: -1 }).success).toBe(false);
    expect(FinishSessionDto.schema.parse({ finishedAt: '2026-10-23T10:15:00.000Z', isIncomplete: false })).toMatchObject({
      finishedAt: '2026-10-23T10:15:00.000Z',
    });
    expect(FinishSessionDto.schema.safeParse({ finishedAt: 'yesterday', isIncomplete: false }).success).toBe(false);
  });
});

const context = {} as AuthContext;
const distanceInput = { sessionId: 'session', blockId: 'cardio', distanceDoneMeters: 0 };
function captureDb(status = 'IN_PROGRESS', block: { id: string } | null = { id: 'cardio' }) {
  const db = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    $transaction: jest.fn(),
    sessionInstance: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({
        id: 'session',
        status,
        template: { kind: 'ROUTINE' },
        cardioBlocks: [{ id: 'cardio' }],
        skippedAt: null,
      }),
    },
    sessionCardioBlock: {
      findFirst: jest.fn().mockResolvedValue(block),
      update: jest.fn().mockImplementation(async ({ data }: { data: unknown }) => ({ id: 'cardio', ...(data as object) })),
    },
    intervalLog: {
      upsert: jest.fn().mockImplementation(async ({ create }: { create: unknown }) => create),
      deleteMany: jest.fn(),
    },
  };
  db.$transaction.mockImplementation(async (run: (tx: typeof db) => Promise<unknown>) => run(db));
  return db;
}
describe('isolated cardio distance capture', () => {
  it.each([0, 1250.5, null])('validates and stores header %s without writing any series', async (distanceDoneMeters) => {
    expect(CardioDistanceDto.schema.safeParse({ distanceDoneMeters }).success).toBe(true);
    const db = captureDb();
    const repo = new SessionsCardioRepositoryPrisma(db as unknown as PrismaService);
    await expect(repo.logCardioDistance(context, { ...distanceInput, distanceDoneMeters })).resolves.toEqual({
      id: 'cardio',
      distanceDoneMeters,
    });
    expect(db.$queryRaw).toHaveBeenCalled();
    expect(db.sessionCardioBlock.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { archivedAt: null, id: 'cardio', sessionId: 'session' } }),
    );
    expect(db.intervalLog.upsert).not.toHaveBeenCalled();
    expect(db.intervalLog.deleteMany).not.toHaveBeenCalled();
  });
  it.each([-1, Infinity, NaN, 500001])('rejects invalid distance %s', (distanceDoneMeters) => {
    expect(CardioDistanceDto.schema.safeParse({ distanceDoneMeters }).success).toBe(false);
  });
  it('rejects completed sessions and unrelated blocks', async () => {
    await expect(
      new SessionsCardioRepositoryPrisma(captureDb('COMPLETED') as unknown as PrismaService).logCardioDistance(
        context,
        distanceInput,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      new SessionsCardioRepositoryPrisma(captureDb('IN_PROGRESS', null) as unknown as PrismaService).logCardioDistance(
        context,
        distanceInput,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
  it('retains an interval containing only a zero heart-rate percentage', async () => {
    const db = captureDb();
    const result = await new SessionsCardioRepositoryPrisma(db as unknown as PrismaService).logInterval(context, {
      sessionId: 'session',
      sessionCardioBlockId: 'cardio',
      intervalIndex: 1,
      hrReservePctDone: 0,
    });
    expect(result).toMatchObject({ hrReservePctDone: 0, hrMaxPctDone: null });
    expect(db.intervalLog.deleteMany).not.toHaveBeenCalled();
  });
  it('enforces session access and the edit window before saving distance', async () => {
    const repo = {
      canAccessSession: jest.fn().mockResolvedValue(false),
      getCardioSessionById: jest.fn().mockResolvedValue(null),
      getSessionById: jest.fn().mockResolvedValue({ sessionDate: new Date('2000-01-01') }),
      logCardioDistance: jest.fn(),
    } as unknown as SessionsRepositoryPort;
    const usecase = new LogCardioDistanceUseCase(repo, new SessionAccessPolicy(repo), new EditWindowPolicy());
    await expect(usecase.execute(context, distanceInput, 120)).rejects.toBeInstanceOf(ForbiddenException);
    (repo.canAccessSession as jest.Mock).mockResolvedValue(true);
    await expect(usecase.execute(context, distanceInput, 120)).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.logCardioDistance).not.toHaveBeenCalled();
  });
});
