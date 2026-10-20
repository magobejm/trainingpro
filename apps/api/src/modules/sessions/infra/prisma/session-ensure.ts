import { Prisma, SessionStatus } from '@prisma/client';
import { buildCreateAuditFields, buildUpdateAuditFields } from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { createOrReread } from '../../../../common/prisma/unique-violation';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { EnsureSessionInput } from '../../domain/session.input';
import { shouldReplacePendingSession } from './session-concurrency';
import { lockSession } from './session-lock';
import {
  mapSessionIsometricCreate,
  mapSessionItemCreate,
  mapSessionMobilityCreate,
  mapSessionPlioCreate,
  mapSessionSportCreate,
} from './sessions-prisma.mappers';
import { sessionInclude } from './sessions-strength.prisma.helpers';
import { mapCardioSessionBlockCreate } from './sessions-cardio.prisma.helpers';

type Membership = { id: string; organizationId: string };
type TemplateWrite = {
  id: string;
  cardioBlocks?: Parameters<typeof mapCardioSessionBlockCreate>[0][];
  isometricBlocks: Parameters<typeof mapSessionIsometricCreate>[0][];
  items: Parameters<typeof mapSessionItemCreate>[0][];
  mobilityBlocks: Parameters<typeof mapSessionMobilityCreate>[0][];
  planDaySnapshot: { planDayId: string; planDayIndex: number; planDayTitle: string };
  plioBlocks: Parameters<typeof mapSessionPlioCreate>[0][];
  sportBlocks: Parameters<typeof mapSessionSportCreate>[0][];
  templateVersion: number;
};
type PendingRow = {
  archivedAt: Date | null;
  id: string;
  planDayId: null | string;
  startedAt: Date | null;
  status: SessionStatus;
};

export async function persistEnsuredSession(
  prisma: PrismaService,
  context: AuthContext,
  input: EnsureSessionInput,
  membership: Membership,
  loadTemplate: (tx: Prisma.TransactionClient) => Promise<TemplateWrite>,
) {
  return prisma.$transaction(async (tx) => {
    let existing = await findExistingSession(tx, input);
    if (existing) {
      await lockSession(tx, existing.id);
      existing = await tx.sessionInstance.findUnique({ where: { id: existing.id }, include: sessionInclude() });
    }
    if (existing && isStartedSession(existing)) {
      return existing;
    }
    if (existing && !existing.archivedAt && !shouldReplacePendingSession(existing, input.planDayId)) {
      return existing;
    }
    const template = await loadTemplate(tx);
    if (existing && shouldRewrite(existing, input.planDayId)) {
      await clearSessionChildren(tx, existing.id);
      return tx.sessionInstance.update({
        where: { id: existing.id },
        data: rewriteData(context, template),
        include: sessionInclude(),
      });
    }
    return createOrReread(
      () =>
        tx.sessionInstance.create({
          data: createData(context, input, membership, template),
          include: sessionInclude(),
        }),
      () => findExistingSession(tx, input),
    );
  });
}

async function findExistingSession(tx: Prisma.TransactionClient, input: EnsureSessionInput) {
  if (!input.planDayId) {
    return tx.sessionInstance.findFirst({
      where: { clientId: input.clientId, sessionDate: input.sessionDate },
      include: sessionInclude(),
    });
  }
  const samePlanDay = await tx.sessionInstance.findFirst({
    where: { clientId: input.clientId, planDayId: input.planDayId, sessionDate: input.sessionDate },
    include: sessionInclude(),
    orderBy: { createdAt: 'desc' },
  });
  if (samePlanDay) return samePlanDay;
  return tx.sessionInstance.findFirst({
    where: {
      archivedAt: null,
      clientId: input.clientId,
      planDayId: null,
      sessionDate: input.sessionDate,
      startedAt: null,
      status: SessionStatus.PENDING,
    },
    include: sessionInclude(),
  });
}

function isStartedSession(existing: PendingRow): boolean {
  return existing.status !== SessionStatus.PENDING || existing.startedAt != null;
}

function shouldRewrite(existing: PendingRow, planDayId?: string): boolean {
  const pending = existing.status === SessionStatus.PENDING && !existing.startedAt;
  return pending && (Boolean(existing.archivedAt) || shouldReplacePendingSession(existing, planDayId));
}

function templateFields(template: TemplateWrite) {
  return {
    cardioBlocks: nested(template.cardioBlocks, mapCardioSessionBlockCreate),
    isometricBlocks: nested(template.isometricBlocks, mapSessionIsometricCreate),
    items: nested(template.items, mapSessionItemCreate),
    mobilityBlocks: nested(template.mobilityBlocks, mapSessionMobilityCreate),
    planDayId: template.planDaySnapshot.planDayId,
    planDayIndex: template.planDaySnapshot.planDayIndex,
    planDayTitle: template.planDaySnapshot.planDayTitle,
    plioBlocks: nested(template.plioBlocks, mapSessionPlioCreate),
    sourceTemplateId: template.id,
    sourceTemplateVersion: template.templateVersion,
    sportBlocks: nested(template.sportBlocks, mapSessionSportCreate),
    status: SessionStatus.PENDING,
  };
}

function nested<T, R>(rows: T[] | undefined, map: (row: T) => R) {
  if (!rows || rows.length === 0) return undefined;
  return { create: rows.map(map) };
}

function createData(context: AuthContext, input: EnsureSessionInput, membership: Membership, template: TemplateWrite) {
  return {
    ...buildCreateAuditFields(context),
    ...templateFields(template),
    clientId: input.clientId,
    coachMembershipId: membership.id,
    organizationId: membership.organizationId,
    sessionDate: input.sessionDate,
  };
}

function rewriteData(context: AuthContext, template: TemplateWrite) {
  return {
    ...buildUpdateAuditFields(context),
    ...templateFields(template),
    archivedAt: null,
  };
}

async function clearSessionChildren(tx: Prisma.TransactionClient, sessionId: string): Promise<void> {
  await Promise.all([
    tx.sessionStrengthItem.deleteMany({ where: { sessionId } }),
    tx.sessionPlioBlock.deleteMany({ where: { sessionId } }),
    tx.sessionMobilityBlock.deleteMany({ where: { sessionId } }),
    tx.sessionIsometricBlock.deleteMany({ where: { sessionId } }),
    tx.sessionSportBlock.deleteMany({ where: { sessionId } }),
    tx.sessionCardioBlock.deleteMany({ where: { sessionId } }),
  ]);
}
