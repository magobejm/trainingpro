import { CLIENT_WARMUPS_INCLUDE, mapClientWarmups } from '../../../../common/plan/client-warmups.mapper';
import { applyRoutineHandoff, handoffTransaction } from '../../../calendar/infra/prisma/routine-handoff.prisma';
import {
  attachRevisionInstructions,
  captureLegacyAssignments,
  recordRoutineAssignment,
} from '../../../plans/infra/prisma/routine-revision.prisma';
import { readLastClientActivities } from './client-last-activity.prisma';
import { readClientStatusFacts, statusForClient } from './client-status.prisma';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { LibraryItemScope, Prisma, Role } from '@prisma/client';
import {
  buildArchiveAuditFields,
  buildCreateAuditFields,
  buildUpdateAuditFields,
} from '../../../../common/audit/audit-fields';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { completeQueryPage, queryPageWindow, type PageSlice } from '../../../../common/pagination/page-query';
import { normalizeSearch } from '../../../../common/text/normalize-search';
import { isUniqueViolation } from '../../../../common/prisma/unique-violation';
import type { ClientCreateInput } from '../../domain/client-create.input';
import type { ClientManagementSection } from '../../domain/client-management-section';
import type { ClientProgressPhoto } from '../../domain/client-progress-photo';
import { mapExerciseGroupFields, PLAN_EXERCISE_GROUP_INCLUDE } from '../../../../common/plan/plan-exercise-group.mapper';
import { toRpeNumber } from '../../../../common/plan/rpe-number';
import type { ClientRoutine, ClientRoutineExercise } from '../../domain/client-routine';
import { mapClientRoutineNeats } from '../../domain/map-client-routine-neats';
import type { ClientUpdateInput } from '../../domain/client-update.input';
import { assertAssignableTrainingPlan } from '../../domain/training-plan-assignment';
import type { Client } from '../../domain/client';
import { selectClients, type ListClientsQuery } from '../../domain/list-clients.query';
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
import {
  resolveClientRoutineSets,
  type PlanSetRow,
  type RoutineBlockPrescription,
} from '../../../../common/plan/client-routine-set.mapper';
import { readLockedFields } from '../../../../common/plan/read-locked-fields';
import { stripMetaNotes } from '../../../../common/notes/parse-meta-notes';
import {
  archiveClientAndReleaseSeat,
  claimTrainingPlanAssignment,
  ensureUniqueClientEmail,
  readActiveClient,
  resolveCoachMembership,
  restoreArchivedClient,
} from './client.repository.prisma.ops';

const CLIENT_LIST_INCLUDE = {
  activeRoutineAssignment: { include: { revision: true } },
  objectiveRef: true,
  trainingPlan: { select: { id: true, name: true } },
} as const;

const CLIENT_WITH_RELATIONS_INCLUDE = {
  activeRoutineAssignment: { include: { revision: true } },
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
      await archiveClientAndReleaseSeat(tx, client.id, membership.organizationId, buildArchiveAuditFields(context));
    });
  }

  async canCoachAccessClient(coachSubject: string, clientId: string): Promise<boolean> {
    const client = await this.prisma.client.findFirst({
      where: {
        archivedAt: null,
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

  async listClientsByCoach(context: AuthContext, query?: ListClientsQuery): Promise<Client[]> {
    const membership = await resolveCoachMembership(context, this.prisma);
    const clients = await this.prisma.client.findMany({
      include: CLIENT_LIST_INCLUDE,
      where: {
        archivedAt: null,
        coachMembershipId: membership.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    const clientIds = clients.map((row) => row.id);
    const [activity, statusFacts] = await Promise.all([
      readLastClientActivities(this.prisma, clientIds),
      readClientStatusFacts(this.prisma, clientIds),
    ]);
    const mapped = clients.map((row) => {
      const lastActivityAt = activity.get(row.id) ?? null;
      return {
        ...mapClient({ ...row, progressPhotos: [] }),
        lastActivityAt,
        status: statusForClient({ facts: statusFacts.get(row.id), hasPlan: Boolean(row.trainingPlanId), lastActivityAt }),
      };
    });
    return selectClients(mapped, query);
  }

  async listClientsPage(context: AuthContext, query: ListClientsQuery & { limit: number }): Promise<PageSlice<Client>> {
    const membership = await resolveCoachMembership(context, this.prisma);
    const { after: cursor, take } = queryPageWindow(query);
    const activitySort = query.sort === 'activity';
    const filters = [Prisma.sql`archived_at IS NULL`, Prisma.sql`coach_membership_id = ${membership.id}::uuid`];
    if (query.objective && query.objective !== 'ALL') filters.push(Prisma.sql`objective_label = ${query.objective}`);
    const needle = query.search ? normalizeSearch(query.search) : undefined;
    if (needle) filters.push(Prisma.sql`name_sort LIKE ${`%${needle}%`}`);
    if (cursor) {
      if (activitySort) {
        filters.push(
          cursor.sort
            ? Prisma.sql`activity_sort IS NOT NULL AND (
              activity_sort COLLATE "C" < ${cursor.sort} COLLATE "C" OR
              (activity_sort COLLATE "C" = ${cursor.sort} COLLATE "C" AND
                client_id::text COLLATE "C" < ${cursor.id} COLLATE "C")
            )`
            : Prisma.sql`activity_sort IS NULL AND client_id::text COLLATE "C" < ${cursor.id} COLLATE "C"`,
        );
      } else {
        filters.push(Prisma.sql`(name_sort COLLATE "C" > ${cursor.sort} COLLATE "C" OR
          (name_sort COLLATE "C" = ${cursor.sort} COLLATE "C" AND client_id::text COLLATE "C" > ${cursor.id} COLLATE "C"))`);
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        const candidates = await tx.$queryRaw<Array<{ id: string; sort: string }>>(Prisma.sql`
        WITH activity AS (
          SELECT client_id,
            MAX(COALESCE(finished_at, session_date::timestamp AT TIME ZONE 'UTC')) AS last_activity
          FROM session_instance
          WHERE archived_at IS NULL AND is_completed = true AND client_id IN (
            SELECT id FROM client WHERE archived_at IS NULL AND coach_membership_id = ${membership.id}::uuid
          )
          GROUP BY client_id
        ), eligible AS (
          SELECT c.id AS client_id,
            c.archived_at,
            c.coach_membership_id,
            o.label AS objective_label,
            normalize_search(concat_ws(' ', c.first_name, c.last_name)) AS name_sort,
            CASE WHEN activity.last_activity IS NULL THEN NULL ELSE
              to_char(date_trunc('milliseconds', activity.last_activity AT TIME ZONE 'UTC'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
            END AS activity_sort
          FROM client c
          JOIN client_objective o ON o.id = c.objective_id
          LEFT JOIN activity ON activity.client_id = c.id
        )
        SELECT client_id::text AS id,
          ${activitySort ? Prisma.sql`COALESCE(activity_sort, '')` : Prisma.sql`name_sort`} AS sort
        FROM eligible
        WHERE ${Prisma.join(filters, ' AND ')}
        ORDER BY ${
          activitySort
            ? Prisma.sql`activity_sort COLLATE "C" DESC NULLS LAST, client_id::text COLLATE "C" DESC`
            : Prisma.sql`name_sort COLLATE "C" ASC, client_id::text COLLATE "C" ASC`
        }
        LIMIT ${take!}
      `);
        const page = completeQueryPage(candidates, query, {
          direction: activitySort ? 'desc' : 'asc',
          id: (client) => client.id,
          sort: (client) => client.sort,
        });
        const visible = page.items;
        if (!visible.length) return { items: [], nextCursor: null };
        const clientIds = visible.map(({ id }) => id);
        const rows = await tx.client.findMany({
          include: CLIENT_LIST_INCLUDE,
          where: { id: { in: clientIds }, archivedAt: null, coachMembershipId: membership.id },
        });
        const [activity, statusFacts] = await Promise.all([
          readLastClientActivities(tx as unknown as PrismaService, clientIds),
          readClientStatusFacts(tx as unknown as PrismaService, clientIds),
        ]);
        const byId = new Map(
          rows.map((row) => {
            const lastActivityAt = activity.get(row.id) ?? null;
            return [
              row.id,
              {
                ...mapClient({ ...row, progressPhotos: [] }),
                lastActivityAt,
                status: statusForClient({
                  facts: statusFacts.get(row.id),
                  hasPlan: Boolean(row.trainingPlanId),
                  lastActivityAt,
                }),
              } satisfies Client,
            ];
          }),
        );
        const items = visible.flatMap(({ id }) => {
          const client = byId.get(id);
          return client ? [client] : [];
        });
        return {
          items,
          nextCursor: page.nextCursor ?? null,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async listArchivedClientsPage(
    context: AuthContext,
    query: { cursor?: string; limit: number; search?: string },
  ): Promise<PageSlice<Client & { archivedAt: Date }>> {
    const membership = await resolveCoachMembership(context, this.prisma);
    const { after: cursor, take } = queryPageWindow(query);
    const filters = [
      Prisma.sql`archived_at IS NOT NULL`,
      Prisma.sql`coach_membership_id = ${membership.id}::uuid`,
      Prisma.sql`organization_id = ${membership.organizationId}::uuid`,
    ];
    const needle = query.search ? normalizeSearch(query.search) : undefined;
    if (needle)
      filters.push(Prisma.sql`normalize_search(concat_ws(' ', first_name, last_name, email)) LIKE ${`%${needle}%`}`);
    if (cursor)
      filters.push(
        Prisma.sql`(
          archived_at < ${cursor.sort}::timestamptz OR
          (archived_at = ${cursor.sort}::timestamptz AND id::text COLLATE "C" < ${cursor.id} COLLATE "C")
        )`,
      );
    return this.prisma.$transaction(
      async (tx) => {
        const candidates = await tx.$queryRaw<Array<{ id: string; sort: string }>>(Prisma.sql`
        SELECT id::text AS id, to_char(archived_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS sort
        FROM client WHERE ${Prisma.join(filters, ' AND ')}
        ORDER BY archived_at DESC, id::text COLLATE "C" DESC LIMIT ${take!}
      `);
        const page = completeQueryPage(candidates, query, {
          direction: 'desc',
          id: (item) => item.id,
          sort: (item) => item.sort,
        });
        if (!page.items.length) return { items: [], nextCursor: null };
        const rows = await tx.client.findMany({
          include: CLIENT_LIST_INCLUDE,
          where: {
            id: { in: page.items.map((item) => item.id) },
            archivedAt: { not: null },
            coachMembershipId: membership.id,
            organizationId: membership.organizationId,
          },
        });
        const byId = new Map(
          rows.map((row) => [row.id, { ...mapClient({ ...row, progressPhotos: [] }), archivedAt: row.archivedAt! }]),
        );
        return {
          items: page.items.flatMap(({ id }) => (byId.has(id) ? [byId.get(id)!] : [])),
          nextCursor: page.nextCursor ?? null,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async restoreClient(context: AuthContext, clientId: string): Promise<void> {
    const membership = await resolveCoachMembership(context, this.prisma);
    try {
      await this.prisma.$transaction(async (tx) => {
        const client = await tx.client.findFirst({
          where: {
            archivedAt: { not: null },
            coachMembershipId: membership.id,
            id: clientId,
            organizationId: membership.organizationId,
          },
          select: { email: true },
        });
        if (!client) throw new NotFoundException('Archived client not found');
        await ensureUniqueClientEmail(tx, membership.organizationId, client.email);
        await restoreArchivedClient(tx, clientId, membership.id, membership.organizationId, context.subject, client.email);
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Client email already exists');
      throw error;
    }
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
    const run = async (tx: Prisma.TransactionClient) => {
      const client = await readActiveClient(tx, membership, clientId);
      if (input.trainingPlanId !== undefined) {
        const current = await tx.client.findUniqueOrThrow({ where: { id: clientId }, select: { trainingPlanId: true } });
        for (const id of [
          ...new Set([current.trainingPlanId, input.trainingPlanId].filter((id): id is string => Boolean(id))),
        ].sort()) {
          await tx.$queryRaw`SELECT id FROM plan_template WHERE id = ${id}::uuid FOR SHARE`;
        }
        if (current.trainingPlanId) await captureLegacyAssignments(tx, current.trainingPlanId);
      }
      if (typeof input.trainingPlanId === 'string') {
        const plan = await tx.planTemplate.findFirst({
          where: { archivedAt: null, id: input.trainingPlanId },
          select: { coachMembershipId: true, scope: true },
        });
        assertAssignableTrainingPlan(plan, membership.id);
      }
      if (input.routineHandoff) {
        if (!input.trainingPlanId) throw new ConflictException('A routine is required for handoff');
        if (input.routineHandoff.candidateTemplateId && input.routineHandoff.candidateTemplateId !== input.trainingPlanId)
          throw new ConflictException('Reviewed routine does not match assignment');
        await applyRoutineHandoff(tx, membership.id, clientId, input.routineHandoff);
      }
      const payload = normalizeUpdateInput(input);
      if (input.trainingPlanId !== undefined) {
        await claimTrainingPlanAssignment(tx, client.id, input.trainingPlanId);
        await recordRoutineAssignment(tx, client.id, input.trainingPlanId, context.subject);
        delete (payload as { trainingPlanId?: null | string }).trainingPlanId;
      }
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
    };
    const updated = input.routineHandoff ? await handoffTransaction(this.prisma, run) : await this.prisma.$transaction(run);
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
      select: { trainingPlanId: true, activeRoutineAssignment: { include: { revision: true } } },
    });
    if (!client?.trainingPlanId) return null;
    return loadClientRoutine(this.prisma, client.trainingPlanId, client.activeRoutineAssignment?.revision);
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

const LIBRARY_ROUTINE_SELECT = {
  coachInstructions: true,
  mediaUrl: true,
  youtubeUrl: true,
} as const;

const LIBRARY_SPORT_SELECT = {
  coachInstructions: true,
  mediaUrl: true,
  youtubeUrl: true,
} as const;

const PLAN_DAY_CONTENT_INCLUDE = {
  warmups: CLIENT_WARMUPS_INCLUDE,
  exercises: {
    where: { archivedAt: null },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      libraryExercise: { select: LIBRARY_ROUTINE_SELECT },
      sets: PLAN_BLOCK_SETS_INCLUDE,
    },
  },
  cardioBlocks: {
    where: { archivedAt: null },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      libraryCardioMethod: { select: LIBRARY_ROUTINE_SELECT },
      sets: PLAN_BLOCK_SETS_INCLUDE,
    },
  },
  plioBlocks: {
    where: { archivedAt: null },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      libraryPlioExercise: { select: LIBRARY_ROUTINE_SELECT },
      sets: PLAN_BLOCK_SETS_INCLUDE,
    },
  },
  mobilityBlocks: {
    where: { archivedAt: null },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      libraryMobilityExercise: { select: LIBRARY_ROUTINE_SELECT },
      sets: PLAN_BLOCK_SETS_INCLUDE,
    },
  },
  isometricBlocks: {
    where: { archivedAt: null },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      libraryIsometricExercise: { select: LIBRARY_ROUTINE_SELECT },
      sets: PLAN_BLOCK_SETS_INCLUDE,
    },
  },
  sportBlocks: {
    where: { archivedAt: null },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      librarySport: { select: LIBRARY_SPORT_SELECT },
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
  neats: { orderBy: { sortOrder: 'asc' as const } },
} as const;

type PlanWithDays = Prisma.PlanTemplateGetPayload<{ include: typeof PLAN_WITH_DAYS_INCLUDE }>;
type PlanDay = PlanWithDays['days'][number];

async function loadClientRoutine(
  prisma: PrismaService,
  planId: string,
  revision?: { version: number; content: Prisma.JsonValue; name: string } | null,
): Promise<ClientRoutine | null> {
  const plan = await prisma.planTemplate.findFirst({
    where: { id: planId, ...(revision ? {} : { archivedAt: null }) },
    include: PLAN_WITH_DAYS_INCLUDE,
  });
  if (!plan) return null;
  await attachRevisionInstructions(prisma, planId, revision?.version ?? plan.templateVersion, plan.days);
  const warmupsByDay = await Promise.all(plan.days.map((day) => mapClientWarmups(prisma, day.warmups)));
  plan.days.forEach((day, index) => {
    (day as PlanDay & { clientWarmups?: unknown }).clientWarmups ??= warmupsByDay[index];
  });
  const snapshot = revision?.content as
    | { expectedCompletionDays?: number; neats?: typeof plan.neats; objectives?: { label: string }[] }
    | undefined;
  return {
    expectedCompletionDays: snapshot ? (snapshot.expectedCompletionDays ?? null) : (plan.expectedCompletionDays ?? null),
    id: plan.id,
    name: revision?.name ?? plan.name,
    neats: mapClientRoutineNeats(snapshot?.neats ?? plan.neats),
    objectives: snapshot?.objectives?.map((o) => o.label) ?? plan.routineObjectives.map((o) => o.objective.label),
    planDays: plan.days.filter((day) => day.revisionVersion === (revision?.version ?? plan.templateVersion)).map(mapPlanDay),
  };
}

type AccessiblePlanDay = PlanDay & { templateId: string; clientWarmups?: unknown };

async function loadAccessibleClientPlanDay(
  prisma: PrismaService,
  email: string,
  planDayId: string,
): Promise<AccessiblePlanDay | null> {
  const client = await prisma.client.findFirst({
    where: { email: email.toLowerCase(), archivedAt: null },
    select: {
      coachMembershipId: true,
      id: true,
      trainingPlanId: true,
      activeRoutineAssignment: { include: { revision: true } },
    },
  });
  if (!client) return null;

  const planDay = await prisma.planDay.findFirst({
    where: {
      archivedAt: null,
      id: planDayId,
      template: {
        OR: [{ coachMembershipId: client.coachMembershipId }, { scope: LibraryItemScope.GLOBAL }],
      },
    },
    include: PLAN_DAY_CONTENT_INCLUDE,
  });
  if (!planDay) return null;

  const inAssignedPlan =
    client.trainingPlanId === planDay.templateId &&
    (!client.activeRoutineAssignment || client.activeRoutineAssignment.revision.version === planDay.revisionVersion);
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

  await attachRevisionInstructions(prisma, planDay.templateId, planDay.revisionVersion, [planDay]);
  return {
    ...planDay,
    clientWarmups:
      (planDay as PlanDay & { clientWarmups?: unknown }).clientWarmups ?? (await mapClientWarmups(prisma, planDay.warmups)),
    templateId: planDay.templateId,
  };
}

function mapPlanDay(day: PlanDay): ClientRoutine['planDays'][number] {
  return {
    warmups: (day as PlanDay & { clientWarmups?: import('@trainerpro/shared').ClientRoutineWarmup[] }).clientWarmups ?? [],
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

function strengthPrescription(e: PlanDay['exercises'][number]): RoutineBlockPrescription {
  return {
    notes: e.notes,
    perSetWeightRangesJson: e.perSetWeightRangesJson,
    repsMax: e.repsMax ?? null,
    repsMin: e.repsMin ?? null,
    restSeconds: e.restSeconds ?? null,
    setsPlanned: e.setsPlanned ?? null,
    targetRir: e.targetRir ?? null,
    targetRpe: toRpeNumber(e.targetRpe),
    weightRangeMaxKg: e.weightRangeMaxKg,
    weightRangeMinKg: e.weightRangeMinKg,
  };
}

function blockPrescription(
  notes: null | string,
  restSeconds: null | number,
  setsPlanned: null | number,
  targetRpe: null | number,
): RoutineBlockPrescription {
  return { notes, restSeconds, setsPlanned, targetRpe };
}

function mapStrengthExercises(exercises: PlanDay['exercises']): ClientRoutineExercise[] {
  return exercises.map((e) =>
    mapRoutineExercise({
      coachInstructions: e.libraryExercise?.coachInstructions ?? null,
      displayName: e.displayName,
      group: e.group,
      id: e.id,
      lockedFields: readLockedFields(e.lockedFieldsJson),
      mediaUrl: e.libraryExercise?.mediaUrl ?? null,
      notes: e.notes,
      prescription: strengthPrescription(e),
      repsMax: e.repsMax ?? null,
      repsMin: e.repsMin ?? null,
      restSeconds: e.restSeconds ?? null,
      sets: e.sets,
      setsPlanned: e.setsPlanned ?? null,
      sortOrder: e.sortOrder,
      targetRir: e.targetRir ?? null,
      targetRpe: toRpeNumber(e.targetRpe),
      type: 'strength',
      youtubeUrl: e.libraryExercise?.youtubeUrl ?? null,
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
      lockedFields: readLockedFields(e.lockedFieldsJson),
      mediaUrl: e.libraryCardioMethod?.mediaUrl ?? null,
      notes: e.notes,
      prescription: {
        ...blockPrescription(e.notes, e.restSeconds ?? null, e.roundsPlanned ?? null, toRpeNumber(e.targetRpe)),
        workSeconds: e.workSeconds,
        targetDistanceMeters: e.targetDistanceMeters,
      },
      repsMax: null,
      repsMin: null,
      restSeconds: e.restSeconds ?? null,
      sets: e.sets,
      setsPlanned: e.roundsPlanned ?? null,
      sortOrder: e.sortOrder,
      targetRir: null,
      targetRpe: toRpeNumber(e.targetRpe),
      type: 'cardio',
      youtubeUrl: e.libraryCardioMethod?.youtubeUrl ?? null,
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
      lockedFields: readLockedFields(e.lockedFieldsJson),
      mediaUrl: e.libraryPlioExercise?.mediaUrl ?? null,
      notes: e.notes,
      prescription: blockPrescription(e.notes, e.restSeconds ?? null, e.roundsPlanned ?? null, toRpeNumber(e.targetRpe)),
      repsMax: null,
      repsMin: null,
      restSeconds: e.restSeconds ?? null,
      sets: e.sets,
      setsPlanned: e.roundsPlanned ?? null,
      sortOrder: e.sortOrder,
      targetRir: null,
      targetRpe: toRpeNumber(e.targetRpe),
      type: 'plio',
      youtubeUrl: e.libraryPlioExercise?.youtubeUrl ?? null,
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
      lockedFields: readLockedFields(e.lockedFieldsJson),
      mediaUrl: e.libraryMobilityExercise?.mediaUrl ?? null,
      notes: e.notes,
      prescription: blockPrescription(e.notes, e.restSeconds ?? null, e.roundsPlanned ?? null, toRpeNumber(e.targetRpe)),
      repsMax: null,
      repsMin: null,
      restSeconds: e.restSeconds ?? null,
      sets: e.sets,
      setsPlanned: e.roundsPlanned ?? null,
      sortOrder: e.sortOrder,
      targetRir: null,
      targetRpe: toRpeNumber(e.targetRpe),
      type: 'mobility',
      youtubeUrl: e.libraryMobilityExercise?.youtubeUrl ?? null,
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
      lockedFields: readLockedFields(e.lockedFieldsJson),
      mediaUrl: e.libraryIsometricExercise?.mediaUrl ?? null,
      notes: e.notes,
      prescription: blockPrescription(e.notes, null, e.setsPlanned ?? null, toRpeNumber(e.targetRpe)),
      repsMax: null,
      repsMin: null,
      restSeconds: null,
      sets: e.sets,
      setsPlanned: e.setsPlanned ?? null,
      sortOrder: e.sortOrder,
      targetRir: null,
      targetRpe: toRpeNumber(e.targetRpe),
      type: 'isometric',
      youtubeUrl: e.libraryIsometricExercise?.youtubeUrl ?? null,
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
      lockedFields: readLockedFields(e.lockedFieldsJson),
      mediaUrl: e.librarySport?.mediaUrl ?? null,
      notes: e.notes,
      prescription: {
        ...blockPrescription(e.notes, null, e.sets?.length || 1, toRpeNumber(e.targetRpe)),
        durationMinutes: e.durationMinutes,
      },
      repsMax: null,
      repsMin: null,
      restSeconds: null,
      sets: e.sets,
      setsPlanned: null,
      sortOrder: e.sortOrder,
      targetRir: null,
      targetRpe: toRpeNumber(e.targetRpe),
      type: 'sport',
      youtubeUrl: e.librarySport?.youtubeUrl ?? null,
    }),
  );
}

function mapRoutineExercise(input: {
  coachInstructions: null | string;
  displayName: string;
  group?: PlanDay['exercises'][number]['group'];
  id: string;
  lockedFields?: string[];
  mediaUrl: null | string;
  notes: null | string;
  prescription?: RoutineBlockPrescription;
  repsMax: null | number;
  repsMin: null | number;
  restSeconds: null | number;
  sets: PlanSetRow[];
  setsPlanned: null | number;
  sortOrder: number;
  targetRir: null | number;
  targetRpe: null | number;
  type: ClientRoutineExercise['type'];
  youtubeUrl: null | string;
}): ClientRoutineExercise {
  const plannedSets = resolveClientRoutineSets(input.sets, input.type, {
    ...input.prescription,
    setsPlanned: input.prescription?.setsPlanned ?? input.setsPlanned,
  });
  const groupFields = mapExerciseGroupFields(input.group);
  return {
    coachInstructions: normalizeCoachInstructions(input.coachInstructions),
    displayName: input.displayName,
    lockedFields: input.lockedFields ?? [],
    ...groupFields,
    id: input.id,
    mediaUrl: input.mediaUrl?.trim() ? input.mediaUrl.trim() : null,
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
    youtubeUrl: input.youtubeUrl?.trim() ? input.youtubeUrl.trim() : null,
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
