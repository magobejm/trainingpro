import { Prisma } from '@prisma/client';
import { buildUpdateAuditFields } from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { nextExerciseOrder, readExerciseOrder } from '../../domain/exercise-order';
import type { SessionWriteOptions } from '../../domain/sessions-repository.port';
import { assertWritableSession } from './session-finish-replace';
import { readWritableSession } from './session-write-scope';

export async function writeExerciseOrder(
  db: Prisma.TransactionClient,
  context: AuthContext,
  sessionId: string,
  itemId: string,
  options?: SessionWriteOptions,
): Promise<void> {
  const session = await readWritableSession(db, sessionId);
  assertWritableSession(session, options);
  const row = await db.sessionInstance.findFirst({
    select: { exerciseOrderJson: true },
    where: { id: sessionId },
  });
  const current = readExerciseOrder(row?.exerciseOrderJson);
  const next = nextExerciseOrder(row?.exerciseOrderJson, itemId, await sessionOwnsItem(db, sessionId, itemId));
  if (next.length === current.length) return;
  await db.sessionInstance.update({
    data: { ...buildUpdateAuditFields(context), exerciseOrderJson: next },
    where: { id: sessionId },
  });
}

async function sessionOwnsItem(db: Prisma.TransactionClient, sessionId: string, itemId: string): Promise<boolean> {
  const where = { archivedAt: null, id: itemId, sessionId };
  const select = { id: true } as const;
  const found = await Promise.all([
    db.sessionStrengthItem.findFirst({ select, where }),
    db.sessionCardioBlock.findFirst({ select, where }),
    db.sessionPlioBlock.findFirst({ select, where }),
    db.sessionMobilityBlock.findFirst({ select, where }),
    db.sessionIsometricBlock.findFirst({ select, where }),
    db.sessionSportBlock.findFirst({ select, where }),
  ]);
  return found.some((entry) => entry != null);
}
