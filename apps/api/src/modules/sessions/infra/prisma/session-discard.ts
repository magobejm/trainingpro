import { ConflictException } from '@nestjs/common';
import { Prisma, SessionStatus } from '@prisma/client';
import { buildUpdateAuditFields } from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';

type LoggedBlock = { logs: unknown[] };
type DiscardableSession = {
  cardioBlocks: Array<{ distanceDoneMeters: null | number; intervalLogs: unknown[] }>;
  id: string;
  isometricBlocks: LoggedBlock[];
  items: LoggedBlock[];
  mobilityBlocks: LoggedBlock[];
  plioBlocks: LoggedBlock[];
  sportBlocks: Array<LoggedBlock & { setLogs: unknown[] }>;
  startedAt: Date | null;
  status: SessionStatus;
};

const RESET_FIELDS = {
  finishComment: null,
  finishedAt: null,
  isCompleted: false,
  isIncomplete: false,
  performedDurationSeconds: null,
  postFatigue: null,
  postMood: null,
  postPain: null,
  preFatigue: null,
  preMotivation: null,
  preRecovery: null,
  sessionRpe: null,
  startMode: null,
  startedAt: null,
  status: SessionStatus.PENDING,
} as const;

export async function discardOpenSession(
  db: Prisma.TransactionClient,
  context: AuthContext,
  session: DiscardableSession,
): Promise<void> {
  if (session.status === SessionStatus.COMPLETED) {
    throw new ConflictException('Session already completed');
  }
  if (session.status === SessionStatus.PENDING && !session.startedAt && !hasRecordedActivity(session)) {
    return;
  }
  await clearSessionActivity(db, session.id);
  const updated = await db.sessionInstance.updateMany({
    data: { ...buildUpdateAuditFields(context), ...RESET_FIELDS },
    where: { archivedAt: null, id: session.id, status: { not: SessionStatus.COMPLETED } },
  });
  if (updated.count === 0) throw new ConflictException('Session already completed');
}

function hasRecordedActivity(session: DiscardableSession): boolean {
  if (session.items.some((item) => item.logs.length > 0)) return true;
  const cardioLogged = session.cardioBlocks.some(
    (block) => block.intervalLogs.length > 0 || block.distanceDoneMeters != null,
  );
  if (cardioLogged) return true;
  if (session.plioBlocks.some((block) => block.logs.length > 0)) return true;
  if (session.mobilityBlocks.some((block) => block.logs.length > 0)) return true;
  if (session.isometricBlocks.some((block) => block.logs.length > 0)) return true;
  return session.sportBlocks.some((block) => block.logs.length > 0 || block.setLogs.length > 0);
}

async function clearSessionActivity(db: Prisma.TransactionClient, sessionId: string): Promise<void> {
  await db.setLog.deleteMany({ where: { sessionId } });
  await db.intervalLog.deleteMany({ where: { sessionId } });
  await db.plioSetLog.deleteMany({ where: { sessionId } });
  await db.mobilitySetLog.deleteMany({ where: { sessionId } });
  await db.isometricSetLog.deleteMany({ where: { sessionId } });
  await db.sportSessionLog.deleteMany({ where: { sessionId } });
  await db.sportSetLog.deleteMany({ where: { sessionId } });
  await db.sessionCardioBlock.updateMany({ data: { distanceDoneMeters: null }, where: { sessionId } });
}
