import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import type { PrismaService } from '../../src/common/prisma/prisma.service';
import type { PrivateMediaUrlSigner } from '../../src/modules/files/domain/private-media-url-signer';
import { ChatRepositoryPrisma } from '../../src/modules/chat/infra/prisma/chat.repository.prisma';
import type { ChatThreadAccessService } from '../../src/modules/chat/infra/prisma/chat-thread-access.service';
import { ChatMessagePolicy } from '../../src/modules/chat/domain/policies/chat-message.policy';

const context: AuthContext = { activeRole: 'coach', roles: ['coach'], subject: 'coach' };
const threadId = '22222222-2222-4222-8222-222222222222';
const message = (i: number, thread = threadId) => ({
  id: '11111111-1111-4111-8111-' + String(i).padStart(12, '0'),
  threadId: thread,
  createdAt: new Date('2026-10-01T10:00:00Z'),
  expiresAt: new Date('2027-10-01T10:00:00Z'),
  senderRole: 'COACH' as const,
  senderSubject: 'coach',
  text: String(i),
  attachments: [],
  callProposal: null,
});

function setup(count: number) {
  const rows = Array.from({ length: count }, (_, index) => message(index));
  const assertAccess = jest.fn().mockResolvedValue({ senderRole: 'COACH', threadId });
  const findFirst = jest.fn(
    async ({ where }: Prisma.ChatMessageFindFirstArgs) =>
      rows.find((row) => row.id === where?.id && row.threadId === where?.threadId) ?? null,
  );
  const findMany = jest.fn(async (args: Prisma.ChatMessageFindManyArgs) => {
    const cutoff = (args.where?.createdAt as Prisma.DateTimeFilter | undefined)?.lt;
    let ordered = rows.filter(
      (row) => row.threadId === args.where?.threadId && (!cutoff || row.createdAt < new Date(cutoff)),
    );
    const stable = Array.isArray(args.orderBy);
    ordered = ordered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || (stable ? b.id.localeCompare(a.id) : 0),
    );
    const start = args.cursor ? ordered.findIndex((row) => row.id === args.cursor?.id) + (args.skip ?? 0) : 0;
    return ordered.slice(start, start + (args.take ?? 50));
  });
  const repo = new ChatRepositoryPrisma(
    new ChatMessagePolicy(),
    { chatMessage: { findMany, findFirst }, chatThread: { update: jest.fn() } } as unknown as PrismaService,
    { sign: (path: string) => path } as PrivateMediaUrlSigner,
    { assertAccess } as unknown as ChatThreadAccessService,
  );
  return { repo, rows, assertAccess, findMany, findFirst };
}

describe('chat history pagination', () => {
  it.each([0, 49, 50, 51, 157])('traverses %i messages without gaps, including equal timestamps', async (count) => {
    const { repo, rows } = setup(count);
    const ids: string[] = [];
    let beforeId: string | undefined;
    do {
      const page = await repo.listMessagesByThread(context, threadId, undefined, beforeId);
      ids.unshift(...page.map((row) => row.id));
      beforeId = page.length === 50 ? page[0]!.id : undefined;
    } while (beforeId && ids.length <= count + 50);
    expect(ids).toEqual(rows.map((row) => row.id));
    expect(new Set(ids).size).toBe(count);
  });

  it('preserves the database ordering when timestamp precision exceeds JavaScript dates', async () => {
    const { repo, findMany } = setup(2);
    // The database can distinguish microseconds even when both rows map to the same millisecond.
    findMany.mockResolvedValueOnce([message(0), message(1)]);
    const page = await repo.listMessagesByThread(context, threadId);
    expect(page.map((row) => row.id)).toEqual([message(1).id, message(0).id]);
  });

  it('rejects missing and foreign cursors with the same controlled error', async () => {
    const { repo, rows, findMany } = setup(2);
    rows.push(message(100, 'foreign-thread'));
    for (const id of [message(999).id, message(100).id]) {
      await expect(repo.listMessagesByThread(context, threadId, undefined, id)).rejects.toThrow(NotFoundException);
    }
    expect(findMany).not.toHaveBeenCalled();
  });

  it('checks access before looking up a cursor', async () => {
    const { repo, assertAccess, findFirst, findMany } = setup(2);
    assertAccess.mockRejectedValue(new ForbiddenException());
    await expect(repo.listMessagesByThread(context, threadId, undefined, message(1).id)).rejects.toThrow(ForbiddenException);
    expect(findFirst).not.toHaveBeenCalled();
    expect(findMany).not.toHaveBeenCalled();
  });

  it('keeps the legacy exclusive timestamp filter', async () => {
    const { repo, rows } = setup(3);
    rows[0]!.createdAt = new Date('2026-09-01T00:00:00Z');
    const page = await repo.listMessagesByThread(context, threadId, rows[1]!.createdAt);
    expect(page.map((row) => row.id)).toEqual([rows[0]!.id]);
  });

  it('prefers beforeId when both cursors are supplied and uses a database cursor', async () => {
    const { repo, findMany } = setup(3);
    const page = await repo.listMessagesByThread(context, threadId, new Date('2000-01-01'), message(2).id);
    expect(page.map((row) => row.id)).toEqual([message(0).id, message(1).id]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { threadId },
        cursor: { id: message(2).id },
        skip: 1,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 50,
      }),
    );
  });
});
