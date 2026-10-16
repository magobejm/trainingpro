import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import type { ClientsRepositoryPort } from '../../src/modules/clients/domain/clients-repository.port';
import type { SessionsRepositoryPort } from '../../src/modules/sessions/domain/sessions-repository.port';
import {
  SkipClientSessionUseCase,
  UndoClientSessionSkipUseCase,
} from '../../src/modules/clients/application/use-cases/skip-client-session.usecase';
import { SessionsRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions.repository.prisma';
import { SessionsCardioRepositoryPrisma } from '../../src/modules/sessions/infra/prisma/sessions-cardio.repository.prisma';
import { closeStaleSessions } from '../../src/modules/sessions/infra/prisma/session-stale';
import { sessionFixture, gate } from './session-transitions.fixture';

const url = process.env.TEST_SESSION_DATABASE_URL;
const postgres = url ? describe : describe.skip;
const HOUR = 60 * 60 * 1000;
jest.setTimeout(20000);
// eslint-disable-next-line max-lines-per-function
postgres('session transitions against PostgreSQL', () => {
  let db: PrismaClient;
  let fixture: Awaited<ReturnType<typeof sessionFixture>>;
  const repo = (client = db) =>
    new SessionsRepositoryPrisma(client as PrismaService, new SessionsCardioRepositoryPrisma(client as PrismaService));
  beforeAll(async () => {
    const local = new URL(url!);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(local.hostname))
      throw new Error('Requires an explicit local test database');
    local.searchParams.set('connection_limit', '5');
    db = new PrismaClient({ datasources: { db: { url: local.toString() } } });
    fixture = await sessionFixture(db);
  });
  afterAll(async () => {
    try {
      if (fixture) await fixture.cleanup();
    } finally {
      await db?.$disconnect();
    }
  });

  it('returns one start timestamp for concurrent starts', async () => {
    const row = await fixture.create();
    const result = await Promise.all([1, 2].map(() => repo().startSession(fixture.context, { sessionId: row.id })));
    expect(result[0]!.startedAt).toEqual(result[1]!.startedAt);
    expect(result.every((item) => item.status === 'IN_PROGRESS')).toBe(true);
    expect((await db.sessionInstance.findUniqueOrThrow({ where: { id: row.id } })).skippedAt).toBeNull();
  });

  it('rejects a stale skip snapshot after the real start commits', async () => {
    const row = await fixture.create();
    const ready = gate(),
      release = gate();
    const sessions = {
      ensureSessionForClient: async () => {
        ready.resolve();
        await release.promise;
        return row;
      },
    } as unknown as SessionsRepositoryPort;
    const clients = {
      findClientByEmail: async () => fixture.client,
      findClientPlanDayTemplateIdByEmail: async () => fixture.template.id,
    } as unknown as ClientsRepositoryPort;
    const skip = new SkipClientSessionUseCase(clients, sessions, db as PrismaService).execute(
      fixture.context,
      {
        offsetMinutes: 0,
        planDayId: row.id,
        sessionDate: row.sessionDate,
      },
      new Date('2026-10-16T12:00:00Z'),
    );
    const rejected = expect(skip).rejects.toBeInstanceOf(ConflictException);
    await ready.promise;
    try {
      await repo().startSession(fixture.context, { sessionId: row.id });
    } finally {
      release.resolve();
    }
    await rejected;
    const current = await db.sessionInstance.findUniqueOrThrow({ where: { id: row.id } });
    expect(current.status).toBe('IN_PROGRESS');
    expect(current.skippedAt).toBeNull();
  });

  it('rejects undo based on a stale pending snapshot', async () => {
    const row = await fixture.create();
    const ready = gate(),
      release = gate();
    const undoDb = {
      client: db.client,
      sessionInstance: {
        findFirst: async () => {
          ready.resolve();
          await release.promise;
          return row;
        },
        updateMany: db.sessionInstance.updateMany.bind(db.sessionInstance),
      },
    } as unknown as PrismaService;
    const undo = new UndoClientSessionSkipUseCase(undoDb).execute(fixture.context, row.id);
    const rejected = expect(undo).rejects.toBeInstanceOf(ConflictException);
    await ready.promise;
    try {
      await repo().startSession(fixture.context, { sessionId: row.id });
    } finally {
      release.resolve();
    }
    await rejected;
  });

  it('waits for a strength set in flight and keeps the session open after it commits', async () => {
    const row = await fixture.create(new Date(Date.now() - 5 * HOUR));
    const writing = gate(),
      release = gate(),
      scanned = gate();
    const extended = db.$extends({
      query: {
        setLog: {
          async upsert({ args, query }) {
            writing.resolve();
            await release.promise;
            return query(args);
          },
        },
        sessionInstance: {
          async findMany({ args, query }) {
            const result = await query(args);
            scanned.resolve();
            return result;
          },
        },
      },
    });
    const writer = repo(extended as unknown as PrismaClient).logSet(fixture.context, {
      sessionId: row.id,
      sessionItemId: row.items[0]!.id,
      setIndex: 0,
      repsDone: 8,
    });
    await writing.promise;
    const closing = closeStaleSessions(
      extended as unknown as PrismaService,
      { sessionId: row.id },
      new Date(Date.now() + 2 * HOUR),
    );
    await scanned.promise;
    release.resolve();
    await Promise.all([writer, closing]);
    const current = await db.sessionInstance.findUniqueOrThrow({ where: { id: row.id } });
    expect(current.status).toBe('IN_PROGRESS');
    expect(current.finishedAt).toBeNull();
    expect(await db.setLog.count({ where: { sessionId: row.id } })).toBe(1);
  });

  it('does not mark a pending workout as skipped after a set commits', async () => {
    const row = await fixture.create();
    const writing = gate(),
      release = gate(),
      ensuring = gate();
    const extended = db.$extends({
      query: {
        setLog: {
          async upsert({ args, query }) {
            writing.resolve();
            await release.promise;
            return query(args);
          },
        },
      },
    });
    const writer = repo(extended as unknown as PrismaClient).logSet(fixture.context, {
      sessionId: row.id,
      sessionItemId: row.items[0]!.id,
      setIndex: 0,
      repsDone: 8,
    });
    await writing.promise;
    const clients = {
      findClientByEmail: async () => fixture.client,
      findClientPlanDayTemplateIdByEmail: async () => fixture.template.id,
    } as unknown as ClientsRepositoryPort;
    const sessions = {
      ensureSessionForClient: async () => {
        ensuring.resolve();
        return row;
      },
    } as unknown as SessionsRepositoryPort;
    const skipping = new SkipClientSessionUseCase(clients, sessions, db as PrismaService).execute(
      fixture.context,
      {
        offsetMinutes: 0,
        planDayId: row.id,
        sessionDate: row.sessionDate,
      },
      new Date('2026-10-16T12:00:00Z'),
    );
    const outcome = Promise.allSettled([skipping]);
    await ensuring.promise;
    release.resolve();
    await writer;
    expect((await outcome)[0]).toMatchObject({ status: 'rejected', reason: expect.any(ConflictException) });
    expect((await db.sessionInstance.findUniqueOrThrow({ where: { id: row.id } })).skippedAt).toBeNull();
  });

  it('rejects a set when the workout was marked as skipped first', async () => {
    const row = await fixture.create();
    await db.sessionInstance.update({ where: { id: row.id }, data: { skippedAt: new Date() } });
    await expect(
      repo().logSet(fixture.context, {
        sessionId: row.id,
        sessionItemId: row.items[0]!.id,
        setIndex: 0,
        repsDone: 8,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(await db.setLog.count({ where: { sessionId: row.id } })).toBe(0);
  });

  it('protects cardio interval writes from a concurrent inactivity close', async () => {
    const row = await fixture.create(new Date(Date.now() - 5 * HOUR));
    const template = await db.planTemplate.create({ data: { name: 'TP-33 cardio', kind: 'CARDIO' } });
    try {
      await db.sessionInstance.update({ where: { id: row.id }, data: { sourceTemplateId: template.id } });
      const block = await db.sessionCardioBlock.create({
        data: { sessionId: row.id, displayName: 'TP-33 interval', workSeconds: 60 },
      });
      const writing = gate(),
        release = gate(),
        scanned = gate();
      const extended = db.$extends({
        query: {
          intervalLog: {
            async upsert({ args, query }) {
              writing.resolve();
              await release.promise;
              return query(args);
            },
          },
          sessionInstance: {
            async findMany({ args, query }) {
              const result = await query(args);
              scanned.resolve();
              return result;
            },
          },
        },
      });
      const cardio = new SessionsCardioRepositoryPrisma(extended as unknown as PrismaService);
      const writer = cardio.logInterval(fixture.context, {
        sessionId: row.id,
        sessionCardioBlockId: block.id,
        intervalIndex: 0,
        durationSecondsDone: 60,
      });
      await writing.promise;
      const closing = closeStaleSessions(
        extended as unknown as PrismaService,
        { sessionId: row.id },
        new Date(Date.now() + 2 * HOUR),
      );
      await scanned.promise;
      release.resolve();
      await Promise.all([writer, closing]);
      expect((await db.sessionInstance.findUniqueOrThrow({ where: { id: row.id } })).status).toBe('IN_PROGRESS');
      expect(await db.intervalLog.count({ where: { sessionId: row.id } })).toBe(1);
    } finally {
      await db.sessionInstance.update({ where: { id: row.id }, data: { sourceTemplateId: fixture.template.id } });
      await db.planTemplate.delete({ where: { id: template.id } });
    }
  });

  it('rejects writes after inactivity closure wins and does not reopen a completed session', async () => {
    const row = await fixture.create(new Date(Date.now() - 7 * HOUR));
    await closeStaleSessions(db as PrismaService, { sessionId: row.id });
    await expect(
      repo().logSet(fixture.context, {
        sessionId: row.id,
        sessionItemId: row.items[0]!.id,
        setIndex: 0,
        repsDone: 8,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    const result = await repo().startSession(fixture.context, { sessionId: row.id });
    expect(result.status).toBe('COMPLETED');
    expect(await db.setLog.count({ where: { sessionId: row.id } })).toBe(0);
  });

  it('requires starting or undoing a skipped workout before an explicit finish', async () => {
    const row = await fixture.create();
    await db.sessionInstance.update({ where: { id: row.id }, data: { skippedAt: new Date() } });
    await expect(
      repo().finishSession(fixture.context, {
        sessionId: row.id,
        isIncomplete: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect((await db.sessionInstance.findUniqueOrThrow({ where: { id: row.id } })).status).toBe('PENDING');
  });

  it('serializes an explicit finish behind a set and rejects a later write', async () => {
    const row = await fixture.create(new Date());
    const writing = gate(),
      release = gate();
    const extended = db.$extends({
      query: {
        setLog: {
          async upsert({ args, query }) {
            writing.resolve();
            await release.promise;
            return query(args);
          },
        },
      },
    });
    const writer = repo(extended as unknown as PrismaClient).logSet(fixture.context, {
      sessionId: row.id,
      sessionItemId: row.items[0]!.id,
      setIndex: 0,
      repsDone: 8,
    });
    await writing.promise;
    const finishing = repo().finishSession(fixture.context, { sessionId: row.id, isIncomplete: false });
    release.resolve();
    await Promise.all([writer, finishing]);
    await expect(
      repo().logSet(fixture.context, {
        sessionId: row.id,
        sessionItemId: row.items[0]!.id,
        setIndex: 1,
        repsDone: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(await db.setLog.count({ where: { sessionId: row.id } })).toBe(1);
  });
});
