/* eslint-disable max-lines -- routine plan mappers kept with repository until a dedicated mapper module split. */
import { Injectable, NotFoundException } from '@nestjs/common';
import { LibraryItemScope, Prisma, Role } from '@prisma/client';
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
import { mapExerciseGroupFields, PLAN_EXERCISE_GROUP_INCLUDE } from '../../../../common/plan/plan-exercise-group.mapper';
import type { ClientRoutine, ClientRoutineExercise } from '../../domain/client-routine';
import type { ClientUpdateInput } from '../../domain/client-update.input';
import type { Client } from '../../domain/client';
import type { ClientObjective } from '../../domain/client-objective';
import type { ClientsRepositoryPort } from '../../domain/clients-repository.port';
import { listClientManagementSections, replaceClientManagementSections } from './client-management-sections.prisma';
import {
  mapProgressPhoto,
  mapClient,
  mapObjective,
  normalizeCreateInput,
  normalizeUpdateInput,
} from './client.repository.prisma.mappers';
import { createClientRecord, resolveObjectiveId } from './client.repository.prisma.helpers';
import { mapPlanSetsToPlannedSnapshots } from '../../../../common/notes/planned-set.mapper';
import { stripMetaNotes } from '../../../../common/notes/parse-meta-notes';
import { decrementClientCount, readActiveClient, resolveCoachMembership } from './client.repository.prisma.ops';

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

  async createProgressPhoto(context: AuthContext, clientId: string, imageUrl: string): Promise<ClientProgressPhoto> {
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

  async deleteProgressPhoto(context: AuthContext, clientId: string, photoId: string): Promise<void> {
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

  async getClientManagementSections(context: AuthContext, clientId: string): Promise<ClientManagementSection[]> {
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

  async updateClient(context: AuthContext, clientId: string, input: ClientUpdateInput): Promise<Client> {
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

  async findClientByEmail(email: string): Promise<Client | null> {
    const client = await this.prisma.client.findFirst({
      where: { email: email.toLowerCase(), archivedAt: null },
      include: CLIENT_WITH_RELATIONS_INCLUDE,
    });
    return client ? mapClient(client) : null;
  }

  async findClientRoutineByEmail(email: string): Promise<ClientRoutine | null> {
    const client = await this.prisma.client.findFirst({
      where: { email: email.toLowerCase(), archivedAt: null },
      select: { trainingPlanId: true },
    });
    if (!client?.trainingPlanId) return null;
    return loadClientRoutine(this.prisma, client.trainingPlanId);
  }

  async findClientPlanDayByEmail(email: string, planDayId: string): Promise<ClientRoutine['planDays'][number] | null> {
    const planDay = await loadAccessibleClientPlanDay(this.prisma, email, planDayId);
    return planDay ? mapPlanDay(planDay) : null;
  }

  async findClientPlanDayTemplateIdByEmail(email: string, planDayId: string): Promise<string | null> {
    const planDay = await loadAccessibleClientPlanDay(this.prisma, email, planDayId);
    return planDay?.templateId ?? null;
  }
}

const PLAN_BLOCK_SETS_INCLUDE = {
  orderBy: { setIndex: 'asc' as const },
};

const PLAN_DAY_CONTENT_INCLUDE = {
  exercises: {
    where: { archivedAt: null },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      libraryExercise: { select: { coachInstructions: true } },
      sets: PLAN_BLOCK_SETS_INCLUDE,
    },
  },
  cardioBlocks: {
    where: { archivedAt: null },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      libraryCardioMethod: { select: { coachInstructions: true } },
      sets: PLAN_BLOCK_SETS_INCLUDE,
    },
  },
  plioBlocks: {
    where: { archivedAt: null },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      libraryPlioExercise: { select: { coachInstructions: true } },
      sets: PLAN_BLOCK_SETS_INCLUDE,
    },
  },
  mobilityBlocks: {
    where: { archivedAt: null },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      libraryMobilityExercise: { select: { coachInstructions: true } },
      sets: PLAN_BLOCK_SETS_INCLUDE,
    },
  },
  isometricBlocks: {
    where: { archivedAt: null },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      libraryIsometricExercise: { select: { coachInstructions: true } },
      sets: PLAN_BLOCK_SETS_INCLUDE,
    },
  },
  sportBlocks: {
    where: { archivedAt: null },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      librarySport: { select: { coachInstructions: true } },
      sets: PLAN_BLOCK_SETS_INCLUDE,
    },
  },
} as const;

const PLAN_WITH_DAYS_INCLUDE = {
  routineObjectives: { include: { objective: true } },
  days: {
    where: { archivedAt: null },
    orderBy: { dayIndex: 'asc' as const },
    include: PLAN_DAY_CONTENT_INCLUDE,
  },
} as const;

type PlanWithDays = Prisma.PlanTemplateGetPayload<{ include: typeof PLAN_WITH_DAYS_INCLUDE }>;
type PlanDay = PlanWithDays['days'][number];

async function loadClientRoutine(prisma: PrismaService, planId: string): Promise<ClientRoutine | null> {
  const plan = await prisma.planTemplate.findFirst({
    where: { id: planId, archivedAt: null },
    include: PLAN_WITH_DAYS_INCLUDE,
  });
  if (!plan) return null;
  return {
    expectedCompletionDays: plan.expectedCompletionDays ?? null,
    id: plan.id,
    name: plan.name,
    objectives: plan.routineObjectives.map((o) => o.objective.label),
    planDays: plan.days.map(mapPlanDay),
  };
}

type AccessiblePlanDay = PlanDay & { templateId: string };

async function loadAccessibleClientPlanDay(
  prisma: PrismaService,
  email: string,
  planDayId: string,
): Promise<AccessiblePlanDay | null> {
  const client = await prisma.client.findFirst({
    where: { email: email.toLowerCase(), archivedAt: null },
    select: { coachMembershipId: true, id: true, trainingPlanId: true },
  });
  if (!client) return null;

  const planDay = await prisma.planDay.findFirst({
    where: {
      archivedAt: null,
      id: planDayId,
      template: {
        archivedAt: null,
        OR: [{ coachMembershipId: client.coachMembershipId }, { scope: LibraryItemScope.GLOBAL }],
      },
    },
    include: PLAN_DAY_CONTENT_INCLUDE,
  });
  if (!planDay) return null;

  const inAssignedPlan = client.trainingPlanId === planDay.templateId;
  if (!inAssignedPlan) {
    const calendarEvent = await prisma.calendarEvent.findFirst({
      where: {
        archivedAt: null,
        clientId: client.id,
        planDayId,
        type: 'workout',
      },
      select: { id: true },
    });
    if (!calendarEvent) return null;
  }

  return { ...planDay, templateId: planDay.templateId };
}

function mapPlanDay(day: PlanDay): ClientRoutine['planDays'][number] {
  return {
    dayIndex: day.dayIndex,
    id: day.id,
    notes: day.notes ?? null,
    title: day.title,
    exercises: buildDayExercises(day),
  };
}

function buildDayExercises(day: PlanDay): ClientRoutine['planDays'][number]['exercises'] {
  return [
    ...mapStrengthExercises(day.exercises),
    ...mapCardioExercises(day.cardioBlocks),
    ...mapPlioExercises(day.plioBlocks),
    ...mapMobilityExercises(day.mobilityBlocks),
    ...mapIsometricExercises(day.isometricBlocks),
    ...mapSportExercises(day.sportBlocks),
  ].sort((a, b) => a.sortOrder - b.sortOrder);
}

function mapStrengthExercises(exercises: PlanDay['exercises']): ClientRoutineExercise[] {
  return exercises.map((e) =>
    mapRoutineExercise({
      coachInstructions: e.libraryExercise?.coachInstructions ?? null,
      displayName: e.displayName,
      group: e.group,
      id: e.id,
      notes: e.notes,
      repsMax: e.repsMax ?? null,
      repsMin: e.repsMin ?? null,
      restSeconds: e.restSeconds ?? null,
      sets: e.sets,
      setsPlanned: e.setsPlanned ?? null,
      sortOrder: e.sortOrder,
      targetRir: e.targetRir ?? null,
      targetRpe: e.targetRpe ?? null,
      type: 'strength',
    }),
  );
}

function mapCardioExercises(blocks: PlanDay['cardioBlocks']): ClientRoutineExercise[] {
  return blocks.map((e) =>
    mapRoutineExercise({
      coachInstructions: e.libraryCardioMethod?.coachInstructions ?? null,
      displayName: e.displayName,
      group: e.group,
      id: e.id,
      notes: e.notes,
      repsMax: null,
      repsMin: null,
      restSeconds: e.restSeconds ?? null,
      sets: e.sets,
      setsPlanned: e.roundsPlanned ?? null,
      sortOrder: e.sortOrder,
      targetRir: null,
      targetRpe: e.targetRpe ?? null,
      type: 'cardio',
    }),
  );
}

function mapPlioExercises(blocks: PlanDay['plioBlocks']): ClientRoutineExercise[] {
  return blocks.map((e) =>
    mapRoutineExercise({
      coachInstructions: e.libraryPlioExercise?.coachInstructions ?? null,
      displayName: e.displayName,
      group: e.group,
      id: e.id,
      notes: e.notes,
      repsMax: null,
      repsMin: null,
      restSeconds: e.restSeconds ?? null,
      sets: e.sets,
      setsPlanned: e.roundsPlanned ?? null,
      sortOrder: e.sortOrder,
      targetRir: null,
      targetRpe: e.targetRpe ?? null,
      type: 'plio',
    }),
  );
}

function mapMobilityExercises(blocks: PlanDay['mobilityBlocks']): ClientRoutineExercise[] {
  return blocks.map((e) =>
    mapRoutineExercise({
      coachInstructions: e.libraryMobilityExercise?.coachInstructions ?? null,
      displayName: e.displayName,
      group: e.group,
      id: e.id,
      notes: e.notes,
      repsMax: null,
      repsMin: null,
      restSeconds: e.restSeconds ?? null,
      sets: e.sets,
      setsPlanned: e.roundsPlanned ?? null,
      sortOrder: e.sortOrder,
      targetRir: null,
      targetRpe: e.targetRpe ?? null,
      type: 'mobility',
    }),
  );
}

function mapIsometricExercises(blocks: PlanDay['isometricBlocks']): ClientRoutineExercise[] {
  return blocks.map((e) =>
    mapRoutineExercise({
      coachInstructions: e.libraryIsometricExercise?.coachInstructions ?? null,
      displayName: e.displayName,
      group: e.group,
      id: e.id,
      notes: e.notes,
      repsMax: null,
      repsMin: null,
      restSeconds: null,
      sets: e.sets,
      setsPlanned: e.setsPlanned ?? null,
      sortOrder: e.sortOrder,
      targetRir: null,
      targetRpe: e.targetRpe ?? null,
      type: 'isometric',
    }),
  );
}

function mapSportExercises(blocks: PlanDay['sportBlocks']): ClientRoutineExercise[] {
  return blocks.map((e) =>
    mapRoutineExercise({
      coachInstructions: e.librarySport?.coachInstructions ?? null,
      displayName: e.displayName,
      group: e.group,
      id: e.id,
      notes: e.notes,
      repsMax: null,
      repsMin: null,
      restSeconds: null,
      sets: e.sets,
      setsPlanned: null,
      sortOrder: e.sortOrder,
      targetRir: null,
      targetRpe: e.targetRpe ?? null,
      type: 'sport',
    }),
  );
}

function mapRoutineExercise(input: {
  coachInstructions: null | string;
  displayName: string;
  group?: PlanDay['exercises'][number]['group'];
  id: string;
  notes: null | string;
  repsMax: null | number;
  repsMin: null | number;
  restSeconds: null | number;
  sets: Array<{ setIndex: number; note?: null | string; advancedTechnique?: null | string }>;
  setsPlanned: null | number;
  sortOrder: number;
  targetRir: null | number;
  targetRpe: null | number;
  type: ClientRoutineExercise['type'];
}): ClientRoutineExercise {
  const plannedSets = mapPlanSetsToPlannedSnapshots(input.sets);
  const groupFields = mapExerciseGroupFields(input.group);
  return {
    coachInstructions: normalizeCoachInstructions(input.coachInstructions),
    displayName: input.displayName,
    ...groupFields,
    id: input.id,
    notes: stripMetaNotes(input.notes),
    repsMax: input.repsMax,
    repsMin: input.repsMin,
    restSeconds: input.restSeconds,
    sets: plannedSets,
    setsPlanned: input.setsPlanned,
    sortOrder: input.sortOrder,
    targetRir: input.targetRir,
    targetRpe: input.targetRpe,
    type: input.type,
  };
}

function normalizeCoachInstructions(value: null | string | undefined): null | string {
  const normalized = value?.trim();
  return normalized ? normalized : null;
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
