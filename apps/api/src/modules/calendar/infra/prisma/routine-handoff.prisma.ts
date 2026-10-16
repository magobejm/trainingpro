import { createHash } from 'node:crypto';
import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { partitionRoutineWorkouts, type RoutineHandoff, type RoutineHandoffPreview } from '@trainerpro/shared';
import type { PrismaService } from '../../../../common/prisma/prisma.service';

export async function readHandoffPreview(
  tx: Prisma.TransactionClient,
  coachMembershipId: string,
  clientId: string,
  from: string,
): Promise<RoutineHandoffPreview> {
  const client = await tx.client.findFirstOrThrow({
    where: { id: clientId, coachMembershipId, archivedAt: null },
    select: { trainingPlanId: true },
  });
  const events = await tx.calendarEvent.findMany({
    where: { clientId, coachMembershipId, archivedAt: null, type: 'workout', date: { gte: new Date(from) } },
    include: { planDay: { select: { title: true } } },
    orderBy: { id: 'asc' },
  });
  const sessions = await tx.sessionInstance.findMany({
    where: { clientId, coachMembershipId, archivedAt: null, sessionDate: { gte: new Date(from) } },
    select: {
      id: true,
      sessionDate: true,
      planDayId: true,
      status: true,
      startedAt: true,
      isCompleted: true,
      isIncomplete: true,
      skippedAt: true,
      skipReason: true,
    },
    orderBy: { id: 'asc' },
  });
  const partition = partitionRoutineWorkouts(
    events.map((event) => ({
      id: event.id,
      type: event.type,
      date: event.date.toISOString().slice(0, 10),
      planDayId: event.planDayId,
      title: event.title || event.planDay?.title || null,
      updatedAt: event.updatedAt.toISOString(),
    })),
    sessions.map((session) => ({
      ...session,
      date: session.sessionDate.toISOString().slice(0, 10),
      startedAt: session.startedAt?.toISOString() ?? null,
    })),
    from,
  );
  const snapshot = { clientId, from, currentRoutineId: client.trainingPlanId, ...partition };
  // Include session identity/status even when the displayed protection reason is unchanged.
  const signature = createHash('sha256').update(JSON.stringify({ snapshot, sessions })).digest('hex');
  return { ...snapshot, signature };
}

export async function lockHandoffRows(tx: Prisma.TransactionClient, clientId: string) {
  // Lock the client first: foreign-key checks block new calendar/session inserts until commit.
  // Lock existing rows regardless of date so a concurrent move cannot enter the future range.
  await tx.$queryRaw`SELECT id FROM client WHERE id = ${clientId}::uuid FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM session_instance WHERE client_id = ${clientId}::uuid
    ORDER BY id FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM calendar_event WHERE client_id = ${clientId}::uuid
    ORDER BY id FOR UPDATE`;
}

export async function applyRoutineHandoff(
  tx: Prisma.TransactionClient,
  coachMembershipId: string,
  clientId: string,
  handoff: RoutineHandoff,
) {
  await lockHandoffRows(tx, clientId);
  const preview = await readHandoffPreview(tx, coachMembershipId, clientId, handoff.from);
  if (preview.signature !== handoff.expectedSignature) {
    throw new ConflictException({
      code: 'ROUTINE_HANDOFF_CHANGED',
      message: 'Routine planning changed. Review the updated preview.',
    });
  }
  if (handoff.mode === 'replace') await archivePreviewWorkouts(tx, coachMembershipId, preview);
}

export async function archivePreviewWorkouts(
  tx: Prisma.TransactionClient,
  coachMembershipId: string,
  preview: RoutineHandoffPreview,
) {
  if (!preview.removable.length) return { count: 0 };
  return tx.calendarEvent.updateMany({
    where: {
      id: { in: preview.removable.map((event) => event.id) },
      clientId: preview.clientId,
      coachMembershipId,
      archivedAt: null,
    },
    data: { archivedAt: new Date() },
  });
}

export async function handoffTransaction<T>(
  prisma: PrismaService,
  run: (tx: Prisma.TransactionClient) => Promise<T>,
  snapshotOnly = false,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(run, {
        // Read fresh committed state after any row-lock wait. A fixed serializable snapshot
        // could miss sessions inserted between the initial permission read and locking.
        isolationLevel: snapshotOnly
          ? Prisma.TransactionIsolationLevel.RepeatableRead
          : Prisma.TransactionIsolationLevel.ReadCommitted,
      });
    } catch (error) {
      if (!isSerializationConflict(error)) throw error;
      if (attempt >= 2)
        throw new ConflictException({
          code: 'ROUTINE_HANDOFF_CHANGED',
          message: 'Routine planning changed. Review the updated preview.',
        });
    }
  }
}

function isSerializationConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  return error.code === 'P2034' || (error.code === 'P2010' && ['40001', '40P01'].includes(String(error.meta?.code)));
}
