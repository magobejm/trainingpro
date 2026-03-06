import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import {
  buildArchiveAuditFields,
  buildCreateAuditFields,
  buildUpdateAuditFields,
} from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { ClientCreateInput } from '../../domain/client-create.input';
import type { ClientManagementSection } from '../../domain/client-management-section';
import type { ClientProgressPhoto } from '../../domain/client-progress-photo';
import type { ClientUpdateInput } from '../../domain/client-update.input';
import type { Client } from '../../domain/client';
import type { ClientObjective } from '../../domain/client-objective';
import type { ClientsRepositoryPort } from '../../domain/clients-repository.port';
import {
  listClientManagementSections,
  replaceClientManagementSections,
} from './client-management-sections.prisma';
import {
  mapProgressPhoto,
  mapClient,
  mapObjective,
  normalizeCreateInput,
  normalizeUpdateInput,
} from './client.repository.prisma.mappers';
import { createClientRecord, resolveObjectiveId } from './client.repository.prisma.helpers';
import {
  decrementClientCount,
  readActiveClient,
  resolveCoachMembership,
} from './client.repository.prisma.ops';

const CLIENT_WITH_RELATIONS_INCLUDE = {
  objectiveRef: true,
  progressPhotos: {
    orderBy: { createdAt: 'asc' as const },
  },
  trainingPlan: { select: { id: true, name: true } },
} as const;

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
    const created = await createClientRecord(
      this.prisma,
      membership,
      normalizedInput,
      audit.updatedBy,
      audit,
      CLIENT_WITH_RELATIONS_INCLUDE,
    );
    const hydrated = await this.prisma.client.findUnique({
      where: { id: created.id, coachMembershipId: membership.id, archivedAt: null },
      include: CLIENT_WITH_RELATIONS_INCLUDE,
    });
    if (!hydrated) {
      throw new NotFoundException('Client not found after create');
    }
    return mapClient(hydrated);
  }

  async createProgressPhoto(
    context: AuthContext,
    clientId: string,
    imageUrl: string,
  ): Promise<ClientProgressPhoto> {
    const membership = await resolveCoachMembership(context, this.prisma);
    return this.prisma.$transaction(async (tx) => {
      await readActiveClient(tx, membership, clientId);
      const created = await tx.clientProgressPhoto.create({
        data: {
          archived: false,
          clientId,
          imageUrl,
        },
      });
      return mapProgressPhoto(created);
    });
  }

  async deleteProgressPhoto(
    context: AuthContext,
    clientId: string,
    photoId: string,
  ): Promise<void> {
    const membership = await resolveCoachMembership(context, this.prisma);
    await this.prisma.$transaction(async (tx) => {
      await readActiveClient(tx, membership, clientId);
      const deleted = await tx.clientProgressPhoto.deleteMany({
        where: { clientId, id: photoId },
      });
      if (deleted.count === 0) {
        throw new NotFoundException('Progress photo not found');
      }
    });
  }

  async getClientById(context: AuthContext, clientId: string): Promise<Client | null> {
    const membership = await resolveCoachMembership(context, this.prisma);
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, archivedAt: null, coachMembershipId: membership.id },
      include: CLIENT_WITH_RELATIONS_INCLUDE,
    });
    return client ? mapClient(client) : null;
  }

  async getClientManagementSections(
    context: AuthContext,
    clientId: string,
  ): Promise<ClientManagementSection[]> {
    const membership = await resolveCoachMembership(context, this.prisma);
    return this.prisma.$transaction(async (tx) => {
      await readActiveClient(tx, membership, clientId);
      return listClientManagementSections(tx, clientId);
    });
  }

  async listClientsByCoach(context: AuthContext): Promise<Client[]> {
    const membership = await resolveCoachMembership(context, this.prisma);
    const clients = await this.prisma.client.findMany({
      include: CLIENT_WITH_RELATIONS_INCLUDE,
      where: {
        archivedAt: null,
        coachMembershipId: membership.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    return clients.map(mapClient);
  }

  async listProgressPhotos(context: AuthContext, clientId: string): Promise<ClientProgressPhoto[]> {
    const membership = await resolveCoachMembership(context, this.prisma);
    return this.prisma.$transaction(async (tx) => {
      await readActiveClient(tx, membership, clientId);
      const items = await tx.clientProgressPhoto.findMany({
        where: { clientId },
        orderBy: { createdAt: 'asc' },
      });
      return items.map(mapProgressPhoto);
    });
  }

  async saveClientManagementSections(
    context: AuthContext,
    clientId: string,
    items: ClientManagementSection[],
  ): Promise<ClientManagementSection[]> {
    const membership = await resolveCoachMembership(context, this.prisma);
    return this.prisma.$transaction(async (tx) => {
      await readActiveClient(tx, membership, clientId);
      return replaceClientManagementSections(tx, clientId, items);
    });
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
          ...CLIENT_WITH_RELATIONS_INCLUDE,
        },
      });
    });
    return mapClient(updated);
  }

  async setProgressPhotoArchived(
    context: AuthContext,
    clientId: string,
    photoId: string,
    archived: boolean,
  ): Promise<ClientProgressPhoto> {
    const membership = await resolveCoachMembership(context, this.prisma);
    return this.prisma.$transaction(async (tx) => {
      await readActiveClient(tx, membership, clientId);
      await updateProgressPhotoArchived(tx, clientId, photoId, archived);
      return mapProgressPhoto(await readProgressPhotoOrThrow(tx, photoId));
    });
  }

  async listObjectives(): Promise<ClientObjective[]> {
    const rows = await this.prisma.clientObjective.findMany({
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
    return rows.map(mapObjective);
  }
}

async function updateProgressPhotoArchived(
  tx: Prisma.TransactionClient,
  clientId: string,
  photoId: string,
  archived: boolean,
): Promise<void> {
  const updated = await tx.clientProgressPhoto.updateMany({
    where: { clientId, id: photoId },
    data: { archived },
  });
  if (updated.count === 0) {
    throw new NotFoundException('Progress photo not found');
  }
}

async function readProgressPhotoOrThrow(tx: Prisma.TransactionClient, photoId: string) {
  const photo = await tx.clientProgressPhoto.findUnique({ where: { id: photoId } });
  if (!photo) {
    throw new NotFoundException('Progress photo not found');
  }
  return photo;
}
