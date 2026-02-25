import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import {
  buildArchiveAuditFields,
  buildCreateAuditFields,
  buildUpdateAuditFields,
} from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { ClientCreateInput } from '../../domain/client-create.input';
import type { ClientUpdateInput } from '../../domain/client-update.input';
import type { Client } from '../../domain/client';
import type { ClientObjective } from '../../domain/client-objective';
import type { ClientsRepositoryPort } from '../../domain/clients-repository.port';
import {
  type ClientDataPayload,
  mapClient,
  mapObjective,
  normalizeCreateInput,
  normalizeUpdateInput,
} from './client.repository.prisma.mappers';
import {
  decrementClientCount,
  ensureClientCapacity,
  ensureClientMembership,
  ensureEmailNotUsedByPrivilegedMembership,
  ensureUniqueClientEmail,
  incrementClientCount,
  readActiveClient,
  resolveCoachMembership,
  tryRestoreArchivedClient,
  type CoachMembership,
} from './client.repository.prisma.ops';

@Injectable()
export class ClientRepositoryPrisma implements ClientsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async archiveClient(context: AuthContext, clientId: string): Promise<void> {
    const membership = await resolveCoachMembership(context, this.prisma);
    await this.prisma.$transaction(async (tx) => {
      const client = await readActiveClient(tx, membership, clientId);
      await tx.client.update({
        where: { id: client.id },
        data: buildArchiveAuditFields(context),
      });
      await decrementClientCount(tx, membership.organizationId);
    });
  }

  async canCoachAccessClient(coachSubject: string, clientId: string): Promise<boolean> {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        coachMembership: {
          archivedAt: null,
          isActive: true,
          role: Role.COACH,
          user: { supabaseUid: coachSubject },
        },
      },
      select: { id: true },
    });
    return Boolean(client);
  }

  async createClient(context: AuthContext, input: ClientCreateInput): Promise<Client> {
    const membership = await resolveCoachMembership(context, this.prisma);
    const audit = buildCreateAuditFields(context);
    const normalizedInput = normalizeCreateInput(input);
    const created = await this.runCreateClientTransaction(
      membership,
      normalizedInput,
      audit.updatedBy,
      audit,
    );
    const hydrated = await this.prisma.client.findUnique({
      where: { id: created.id, coachMembershipId: membership.id, archivedAt: null },
      include: {
        objectiveRef: true,
        trainingPlan: { select: { id: true, name: true } },
      },
    });
    if (!hydrated) {
      throw new NotFoundException('Client not found after create');
    }
    return mapClient(hydrated);
  }

  async getClientById(context: AuthContext, clientId: string): Promise<Client | null> {
    const membership = await resolveCoachMembership(context, this.prisma);
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, archivedAt: null, coachMembershipId: membership.id },
      include: {
        objectiveRef: true,
        trainingPlan: { select: { id: true, name: true } },
      },
    });
    return client ? mapClient(client) : null;
  }

  async listClientsByCoach(context: AuthContext): Promise<Client[]> {
    const membership = await resolveCoachMembership(context, this.prisma);
    const clients = await this.prisma.client.findMany({
      include: {
        objectiveRef: true,
        trainingPlan: { select: { id: true, name: true } },
      },
      where: {
        archivedAt: null,
        coachMembershipId: membership.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    return clients.map(mapClient);
  }

  async updateClient(
    context: AuthContext,
    clientId: string,
    input: ClientUpdateInput,
  ): Promise<Client> {
    const membership = await resolveCoachMembership(context, this.prisma);
    const updated = await this.prisma.$transaction(async (tx) => {
      const client = await readActiveClient(tx, membership, clientId);
      const payload = normalizeUpdateInput(input);
      if (input.objectiveId !== undefined) {
        payload.objectiveRef = {
          connect: { id: await resolveObjectiveId(tx, input.objectiveId) },
        };
      }
      return tx.client.update({
        where: { id: client.id },
        data: {
          ...payload,
          ...buildUpdateAuditFields(context),
        },
        include: {
          objectiveRef: true,
          trainingPlan: { select: { id: true, name: true } },
        },
      });
    });
    return mapClient(updated);
  }

  async listObjectives(): Promise<ClientObjective[]> {
    const rows = await this.prisma.clientObjective.findMany({
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
    return rows.map(mapObjective);
  }

  private runCreateClientTransaction(
    membership: CoachMembership,
    normalizedInput: ReturnType<typeof normalizeCreateInput>,
    updatedBy: string,
    audit: ReturnType<typeof buildCreateAuditFields>,
  ) {
    const { clientSupabaseUid, objectiveId, ...clientData } = normalizedInput;
    return this.prisma.$transaction(async (tx) => {
      await this.ensureCreatePreconditions(tx, membership, clientData.email, clientSupabaseUid);
      const resolvedObjectiveId = await resolveObjectiveId(tx, objectiveId);
      const payload: ClientDataPayload = {
        ...clientData,
        objectiveId: resolvedObjectiveId,
      };
      const client = await this.createOrRestoreClient(tx, membership, payload, audit, updatedBy);
      await incrementClientCount(tx, membership.organizationId);
      return client;
    });
  }

  private async ensureCreatePreconditions(
    tx: Parameters<typeof ensureClientCapacity>[0],
    membership: CoachMembership,
    email: string,
    clientSupabaseUid?: string,
  ): Promise<void> {
    await ensureClientCapacity(tx, membership.organizationId);
    await ensureEmailNotUsedByPrivilegedMembership(tx, membership.organizationId, email);
    await ensureUniqueClientEmail(tx, membership.organizationId, email);
    await ensureClientMembership(tx, membership.organizationId, { clientSupabaseUid, email });
  }

  private async createOrRestoreClient(
    tx: Parameters<typeof tryRestoreArchivedClient>[0],
    membership: CoachMembership,
    clientData: ClientDataPayload,
    audit: ReturnType<typeof buildCreateAuditFields>,
    updatedBy: string,
  ) {
    const restored = await tryRestoreArchivedClient(
      tx,
      membership.organizationId,
      clientData,
      updatedBy,
    );
    if (restored) {
      return restored;
    }
    return this.createNewClient(tx, membership, clientData, audit);
  }

  private createNewClient(
    tx: Prisma.TransactionClient,
    membership: CoachMembership,
    clientData: ClientDataPayload,
    audit: ReturnType<typeof buildCreateAuditFields>,
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
      include: {
        objectiveRef: true,
        trainingPlan: { select: { id: true, name: true } },
      },
    });
  }
}

async function resolveObjectiveId(
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
