import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type { ClientDataPayload } from './client.repository.prisma.mappers';

export type CoachMembership = {
  id: string;
  organizationId: string;
};

type PrismaClientWithObjective = Prisma.ClientGetPayload<{
  include: {
    objectiveRef: true;
    trainingPlan: { select: { id: true; name: true } };
  };
}>;

export async function decrementClientCount(
  tx: Prisma.TransactionClient,
  organizationId: string,
): Promise<void> {
  const subscription = await tx.organizationSubscription.findUnique({
    where: { organizationId },
    select: { activeClientCount: true, id: true },
  });
  if (!subscription) {
    return;
  }
  const activeClientCount = Math.max(0, subscription.activeClientCount - 1);
  await tx.organizationSubscription.update({
    where: { id: subscription.id },
    data: { activeClientCount },
  });
}

export async function ensureClientCapacity(
  tx: Prisma.TransactionClient,
  organizationId: string,
): Promise<void> {
  const subscription = await tx.organizationSubscription.findUnique({
    where: { organizationId },
    select: { activeClientCount: true, clientLimit: true },
  });
  if (!subscription) {
    throw new ConflictException('Organization subscription not configured');
  }
  if (subscription.activeClientCount >= subscription.clientLimit) {
    throw new ConflictException('Client limit reached for organization');
  }
}

export async function ensureClientMembership(
  tx: Prisma.TransactionClient,
  organizationId: string,
  input: { clientSupabaseUid?: string; email: string },
): Promise<void> {
  if (!input.clientSupabaseUid) {
    return;
  }
  const user = await resolveClientUser(tx, input.clientSupabaseUid, input.email);
  await upsertClientMembership(tx, organizationId, user.id);
}

export async function tryRestoreArchivedClient(
  tx: Prisma.TransactionClient,
  organizationId: string,
  clientData: ClientDataPayload,
  updatedBy: string,
): Promise<null | PrismaClientWithObjective> {
  const archived = await findArchivedClientByEmail(tx, organizationId, clientData.email);
  if (!archived) {
    return null;
  }
  return restoreClient(tx, archived.id, clientData, updatedBy);
}

function findArchivedClientByEmail(
  tx: Prisma.TransactionClient,
  organizationId: string,
  email: string,
) {
  return tx.client.findFirst({
    where: { archivedAt: { not: null }, email, organizationId },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    select: { id: true },
  });
}

function restoreClient(
  tx: Prisma.TransactionClient,
  id: string,
  data: ClientDataPayload,
  updatedBy: string,
) {
  const { objectiveId, trainingPlanId, ...rest } = data;
  return tx.client.update({
    where: { id },
    data: {
      ...rest,
      archivedAt: null,
      archivedBy: null,
      objectiveId,
      trainingPlanId: trainingPlanId ?? null,
      updatedBy,
    },
    include: {
      objectiveRef: true,
      trainingPlan: { select: { id: true, name: true } },
    },
  }) as unknown as Promise<PrismaClientWithObjective>;
}

export async function ensureUniqueClientEmail(
  tx: Prisma.TransactionClient,
  organizationId: string,
  email: string,
): Promise<void> {
  const existing = await tx.client.findFirst({
    where: { archivedAt: null, email, organizationId },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictException('Client email already exists');
  }
}

export async function ensureEmailNotUsedByPrivilegedMembership(
  tx: Prisma.TransactionClient,
  organizationId: string,
  email: string,
): Promise<void> {
  const existing = await tx.organizationMember.findFirst({
    where: {
      archivedAt: null,
      isActive: true,
      organizationId,
      role: { in: [Role.ADMIN, Role.COACH] },
      user: { email },
    },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictException('Email already belongs to an admin or coach');
  }
}

export async function incrementClientCount(
  tx: Prisma.TransactionClient,
  organizationId: string,
): Promise<void> {
  await tx.organizationSubscription.update({
    where: { organizationId },
    data: { activeClientCount: { increment: 1 } },
  });
}

export async function readActiveClient(
  tx: Prisma.TransactionClient,
  membership: CoachMembership,
  clientId: string,
): Promise<{ id: string }> {
  const client = await tx.client.findFirst({
    where: {
      archivedAt: null,
      coachMembershipId: membership.id,
      id: clientId,
    },
    select: { id: true },
  });
  if (!client) {
    throw new NotFoundException('Client not found');
  }
  return client;
}

export async function resolveCoachMembership(
  context: AuthContext,
  tx: Prisma.TransactionClient | PrismaService,
): Promise<CoachMembership> {
  const membership = await tx.organizationMember.findFirst({
    where: {
      archivedAt: null,
      isActive: true,
      role: Role.COACH,
      user: { supabaseUid: context.subject },
    },
    select: { id: true, organizationId: true },
  });
  if (!membership) {
    throw new ForbiddenException('Coach membership not found');
  }
  return membership;
}

async function resolveClientUser(
  tx: Prisma.TransactionClient,
  supabaseUid: string,
  email: string,
): Promise<{ id: string }> {
  const bySubject = await readUserBySubject(tx, supabaseUid);
  const byEmail = await readUserByEmail(tx, email);
  if (bySubject && byEmail && bySubject.id !== byEmail.id) {
    return reconcileConflictingUsers(tx, byEmail.id, supabaseUid);
  }
  if (bySubject) {
    return updateSubjectUser(tx, bySubject.id, email);
  }
  if (byEmail) {
    return updateEmailUser(tx, byEmail.id, supabaseUid);
  }
  return createClientUser(tx, email, supabaseUid);
}

async function upsertClientMembership(
  tx: Prisma.TransactionClient,
  organizationId: string,
  userId: string,
): Promise<void> {
  await tx.organizationMember.upsert({
    where: {
      organizationId_userId_role: {
        organizationId,
        role: Role.CLIENT,
        userId,
      },
    },
    create: { organizationId, role: Role.CLIENT, userId },
    update: { archivedAt: null, isActive: true },
  });
}

function readUserBySubject(tx: Prisma.TransactionClient, supabaseUid: string) {
  return tx.user.findUnique({
    where: { supabaseUid },
    select: { id: true },
  });
}

function readUserByEmail(tx: Prisma.TransactionClient, email: string) {
  return tx.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

function reconcileConflictingUsers(
  tx: Prisma.TransactionClient,
  userId: string,
  supabaseUid: string,
): Promise<{ id: string }> {
  return tx.user.update({
    where: { id: userId },
    data: { isActive: true, supabaseUid },
    select: { id: true },
  });
}

function updateSubjectUser(
  tx: Prisma.TransactionClient,
  userId: string,
  email: string,
): Promise<{ id: string }> {
  return tx.user.update({
    where: { id: userId },
    data: { email, isActive: true },
    select: { id: true },
  });
}

function updateEmailUser(
  tx: Prisma.TransactionClient,
  userId: string,
  supabaseUid: string,
): Promise<{ id: string }> {
  return tx.user.update({
    where: { id: userId },
    data: { isActive: true, supabaseUid },
    select: { id: true },
  });
}

function createClientUser(
  tx: Prisma.TransactionClient,
  email: string,
  supabaseUid: string,
): Promise<{ id: string }> {
  return tx.user.create({
    data: { email, supabaseUid },
    select: { id: true },
  });
}
