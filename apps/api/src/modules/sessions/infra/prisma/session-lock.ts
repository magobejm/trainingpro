import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../../../common/prisma/prisma.service';

/** All session mutations lock the parent before reading state or writing activity. */
export async function lockSession(tx: Prisma.TransactionClient, sessionId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM session_instance WHERE id = ${sessionId}::uuid FOR UPDATE`;
}

export function withLockedSession<T>(
  prisma: PrismaService,
  sessionId: string,
  run: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await lockSession(tx, sessionId);
      return run(tx);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );
}
