import { createHash } from 'node:crypto';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { partitionRoutineWorkouts, type RoutineHandoff, type RoutineHandoffPreview } from '@trainerpro/shared';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import { compareRoutineContent, normalizeRoutineContent } from '@trainerpro/shared';
import { readRoutineContent } from '../../../plans/infra/prisma/routine-revision.prisma';

export async function readHandoffPreview(
  tx: Prisma.TransactionClient,
  coachMembershipId: string,
  clientId: string,
  from: string,
  candidateTemplateId?: string,
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
  let review = {};
  let reviewedContent: unknown;
  if (candidateTemplateId) {
    const candidate = await tx.planTemplate.findFirst({
      where: { id: candidateTemplateId, archivedAt: null, OR: [{ coachMembershipId }, { scope: 'GLOBAL' }] },
    });
    if (!candidate) throw new ForbiddenException('Routine not accessible');
    const current = await tx.client.findUniqueOrThrow({
      where: { id: clientId },
      include: { activeRoutineAssignment: { include: { revision: true } } },
    });
    const assignment = current.activeRoutineAssignment;
    const applied = assignment?.revision;
    const oldContent =
      applied?.content ?? (client.trainingPlanId ? await readRoutineContent(tx, client.trainingPlanId) : null);
    const candidateContent = await readRoutineContent(tx, candidateTemplateId);
    const old = oldContent as { name?: string; templateVersion?: number } | null;
    review = {
      appliedRoutine: old
        ? {
            name: applied?.name ?? old.name ?? '',
            templateId: client.trainingPlanId!,
            version: applied?.version ?? old.templateVersion ?? 1,
            initial: assignment?.initial ?? true,
            appliedAt: assignment?.appliedAt.toISOString() ?? null,
          }
        : null,
      candidateRoutine: { name: candidate.name, templateId: candidate.id, version: candidate.templateVersion },
      comparison: compareRoutineContent(oldContent, candidateContent),
    };
    reviewedContent = {
      assignmentIdentity:
        assignment && !assignment.initial
          ? assignment.id
          : client.trainingPlanId
            ? `initial:${client.trainingPlanId}:${applied?.version ?? old?.templateVersion ?? 1}`
            : null,
      // PostgreSQL JSONB reorders object keys. Hash canonical content so freezing a
      // legacy assignment cannot invalidate an otherwise identical review.
      oldContent: normalizeRoutineContent(oldContent),
      candidateContent: normalizeRoutineContent(candidateContent),
      candidateTemplateId,
      version: candidate.templateVersion,
      updatedAt: candidate.updatedAt,
    };
  }
  // Include session identity/status even when the displayed protection reason is unchanged.
  const signature = createHash('sha256').update(JSON.stringify({ snapshot, sessions, reviewedContent })).digest('hex');
  return { ...snapshot, signature, ...review };
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
  const preview = await readHandoffPreview(tx, coachMembershipId, clientId, handoff.from, handoff.candidateTemplateId);
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
