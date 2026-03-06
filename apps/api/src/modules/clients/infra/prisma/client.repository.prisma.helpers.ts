import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildCreateAuditFields } from '../../../../common/audit/audit-fields';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  ensureClientCapacity,
  ensureClientMembership,
  ensureEmailNotUsedByPrivilegedMembership,
  ensureUniqueClientEmail,
  incrementClientCount,
  tryRestoreArchivedClient,
  type CoachMembership,
} from './client.repository.prisma.ops';
import { seedMissingClientManagementSections } from './client-management-sections.prisma';
import { type ClientDataPayload, normalizeCreateInput } from './client.repository.prisma.mappers';

type CreateAudit = ReturnType<typeof buildCreateAuditFields>;
type Tx = Prisma.TransactionClient;

export async function createClientRecord(
  prisma: PrismaService,
  membership: CoachMembership,
  normalizedInput: ReturnType<typeof normalizeCreateInput>,
  updatedBy: string,
  audit: CreateAudit,
  include: Prisma.ClientInclude,
) {
  const { clientSupabaseUid, objectiveId, ...clientData } = normalizedInput;
  return prisma.$transaction(async (tx) => {
    await ensureCreatePreconditions(tx, membership, clientData.email, clientSupabaseUid);
    const payload: ClientDataPayload = {
      ...clientData,
      objectiveId: await resolveObjectiveId(tx, objectiveId),
    };
    const client = await createOrRestoreClient(tx, membership, payload, audit, updatedBy, include);
    await incrementClientCount(tx, membership.organizationId);
    return client;
  });
}

async function ensureCreatePreconditions(
  tx: Tx,
  membership: CoachMembership,
  email: string,
  clientSupabaseUid?: string,
): Promise<void> {
  await ensureClientCapacity(tx, membership.organizationId);
  await ensureEmailNotUsedByPrivilegedMembership(tx, membership.organizationId, email);
  await ensureUniqueClientEmail(tx, membership.organizationId, email);
  await ensureClientMembership(tx, membership.organizationId, { clientSupabaseUid, email });
}

async function createOrRestoreClient(
  tx: Tx,
  membership: CoachMembership,
  clientData: ClientDataPayload,
  audit: CreateAudit,
  updatedBy: string,
  include: Prisma.ClientInclude,
) {
  const restored = await tryRestoreArchivedClient(
    tx,
    membership.organizationId,
    clientData,
    updatedBy,
  );
  if (restored) {
    await seedMissingClientManagementSections(tx, restored.id);
    return restored;
  }
  const created = await createNewClient(tx, membership, clientData, audit, include);
  await seedMissingClientManagementSections(tx, created.id);
  return created;
}

function createNewClient(
  tx: Tx,
  membership: CoachMembership,
  clientData: ClientDataPayload,
  audit: CreateAudit,
  include: Prisma.ClientInclude,
) {
  const { objectiveId, trainingPlanId, ...rest } = clientData;
  return tx.client.create({
    data: {
      ...audit,
      ...rest,
      coachMembershipId: membership.id,
      objectiveId,
      organizationId: membership.organizationId,
      trainingPlanId: trainingPlanId ?? null,
    },
    include,
  });
}

export async function resolveObjectiveId(
  tx: Prisma.TransactionClient | PrismaService,
  inputObjectiveId: null | string,
): Promise<string> {
  if (inputObjectiveId) {
    const selected = await tx.clientObjective.findUnique({
      where: { id: inputObjectiveId },
      select: { id: true },
    });
    if (selected) {
      return selected.id;
    }
  }
  const fallback = await tx.clientObjective.findFirst({
    where: { isDefault: true },
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    select: { id: true },
  });
  if (!fallback) {
    throw new ForbiddenException('Default client objective not found');
  }
  return fallback.id;
}
