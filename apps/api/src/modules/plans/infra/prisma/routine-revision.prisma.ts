/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from '@prisma/client';
import { CLIENT_WARMUPS_INCLUDE, mapClientWarmups } from '../../../../common/plan/client-warmups.mapper';
import { mapRoutineTemplate, routineTemplateInclude } from './plans-routine.prisma.helpers';

type Tx = Prisma.TransactionClient;
const blockLibraries: Record<string, string> = {
  exercises: 'libraryExercise',
  cardioBlocks: 'libraryCardioMethod',
  plioBlocks: 'libraryPlioExercise',
  mobilityBlocks: 'libraryMobilityExercise',
  isometricBlocks: 'libraryIsometricExercise',
  sportBlocks: 'librarySport',
};

export async function readRoutineContent(tx: Tx, templateId: string) {
  const template = await tx.planTemplate.findUniqueOrThrow({ where: { id: templateId }, select: { templateVersion: true } });
  const frozen = await tx.routineRevision.findUnique({
    where: { templateId_version: { templateId, version: template.templateVersion } },
  });
  if (frozen) return frozen.content as Prisma.InputJsonObject;
  const include = routineTemplateInclude();
  include.routineObjectives = { include: { objective: true } };
  for (const [key, relation] of Object.entries(blockLibraries)) include.days.include[key].include[relation] = true;
  include.days.include.warmups = {
    ...CLIENT_WARMUPS_INCLUDE,
    include: {
      warmupTemplate: {
        include: { ...CLIENT_WARMUPS_INCLUDE.include.warmupTemplate.include, groups: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  };
  const row: any = await tx.planTemplate.findUniqueOrThrow({ where: { id: templateId }, include });
  row.days = row.days.filter((day: any) => day.revisionVersion === row.templateVersion);
  const mapped = mapRoutineTemplate(row, {
    expectedCompletionDays: row.expectedCompletionDays,
    objectiveIds: row.routineObjectives.map((item: any) => item.objectiveId),
    objectives: row.routineObjectives.map((item: any) => item.objective),
  });
  const clientWarmups = await Promise.all(row.days.map((day: any) => mapClientWarmups(tx, day.warmups)));
  mapped.days.forEach((day: any, index: number) => {
    day.clientWarmups = clientWarmups[index];
    const source = row.days[index];
    const groups = new Map(
      source.exerciseGroups.map((group: any) => [
        group.id,
        { groupType: group.groupType, sortOrder: group.sortOrder, note: group.note },
      ]),
    );
    for (const [key, relation] of Object.entries(blockLibraries)) {
      day[key].forEach((block: any, blockIndex: number) => {
        block.group = groups.get(source[key][blockIndex].groupId) ?? null;
        delete block.groupId;
        block.coachInstructions = source[key][blockIndex][relation]?.coachInstructions ?? null;
      });
    }
    day.warmups = source.warmups.map((warmup: any) => {
      const template = warmup.warmupTemplate;
      const groups = new Map(template.groups.map((group: any) => [group.id, copyFields(group, ['id', 'templateId'])]));
      return {
        ...template,
        items: template.items.map((item: any) => ({
          ...copyFields(item, [
            'groupId',
            'group',
            'libraryExercise',
            'libraryCardioMethod',
            'libraryPlioExercise',
            'libraryMobilityExercise',
          ]),
          group: groups.get(item.groupId) ?? null,
        })),
      };
    });
    delete day.warmupTemplateIds;
  });
  return JSON.parse(JSON.stringify(mapped)) as Prisma.InputJsonObject;
}

export async function ensureRoutineRevision(tx: Tx, templateId: string, initial = false) {
  const template = await tx.planTemplate.findUniqueOrThrow({ where: { id: templateId } });
  const existing = await tx.routineRevision.findUnique({
    where: { templateId_version: { templateId, version: template.templateVersion } },
  });
  if (existing) return existing;
  await freezeDayWarmups(tx, templateId, template.templateVersion);
  return tx.routineRevision.upsert({
    where: { templateId_version: { templateId, version: template.templateVersion } },
    create: {
      templateId,
      version: template.templateVersion,
      name: template.name,
      initial,
      content: await readRoutineContent(tx, templateId),
    },
    update: {},
  });
}

async function freezeDayWarmups(tx: Tx, templateId: string, version: number) {
  const references = await tx.planDayWarmup.findMany({
    where: { planDay: { templateId, revisionVersion: version } },
    include: { warmupTemplate: { include: { items: true, groups: true } } },
  });
  const copied = new Map<string, string>();
  for (const reference of references) {
    if (reference.warmupTemplate.isRevision) continue;
    let frozenId = copied.get(reference.warmupTemplateId);
    if (!frozenId) {
      const source = reference.warmupTemplate;
      const { items, groups } = source;
      const data = copyFields(source, ['id', 'items', 'groups', 'clientSaveId', 'createdAt', 'updatedAt']);
      const frozen = await tx.warmupTemplate.create({ data: { ...data, archivedAt: null, isRevision: true } });
      const groupIds = new Map<string, string>();
      for (const group of groups) {
        const fields = copyFields(group, ['id', 'templateId', 'createdAt', 'updatedAt']);
        const copy = await tx.warmupTemplateGroup.create({ data: { ...fields, templateId: frozen.id } });
        groupIds.set(group.id, copy.id);
      }
      for (const item of items) {
        const fields = copyFields(item, ['id', 'templateId', 'createdAt', 'updatedAt', 'groupId']);
        await tx.warmupTemplateItem.create({
          data: {
            ...fields,
            metadataJson: fields.metadataJson ?? Prisma.DbNull,
            groupId: item.groupId ? groupIds.get(item.groupId) : null,
            templateId: frozen.id,
          },
        });
      }
      frozenId = frozen.id;
      copied.set(source.id, frozenId);
    }
    await tx.planDayWarmup.update({ where: { id: reference.id }, data: { warmupTemplateId: frozenId } });
  }
}

function copyFields<T extends object, K extends keyof T>(value: T, excluded: K[]): Omit<T, K> {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !excluded.includes(key as K))) as Omit<T, K>;
}

/** Preserve library instructions as they were when the routine was applied. */
export async function attachRevisionInstructions(tx: Tx, templateId: string, version: number, days: any[]) {
  const revision = await tx.routineRevision.findUnique({ where: { templateId_version: { templateId, version } } });
  const content = revision?.content as { days?: any[] } | undefined;
  for (const day of days) {
    const saved = content?.days?.find((item) => item.dayIndex === day.dayIndex);
    if (!saved) continue;
    if (saved.clientWarmups) day.clientWarmups = saved.clientWarmups;
    for (const [key, relation] of Object.entries(blockLibraries))
      (day[key] ?? []).forEach((block: any, index: number) => {
        block[relation] = { ...block[relation], coachInstructions: saved[key]?.[index]?.coachInstructions ?? null };
      });
  }
}

/** Capture pre-existing assignments before any edit can replace their source content. */
export async function captureLegacyAssignments(tx: Tx, templateId: string) {
  const clients = await tx.client.findMany({
    where: { trainingPlanId: templateId, activeRoutineAssignmentId: null },
    orderBy: { id: 'asc' },
  });
  if (!clients.length) return;
  const revision = await ensureRoutineRevision(tx, templateId, true);
  for (const client of clients) {
    await tx.$queryRaw`SELECT id FROM client WHERE id = ${client.id}::uuid FOR UPDATE`;
    const current = await tx.client.findUniqueOrThrow({ where: { id: client.id } });
    if (current.activeRoutineAssignmentId || current.trainingPlanId !== templateId) continue;
    const assignment = await tx.routineAssignment.create({
      data: { clientId: client.id, revisionId: revision.id, appliedBy: client.updatedBy, initial: true },
    });
    await tx.client.update({ where: { id: client.id }, data: { activeRoutineAssignmentId: assignment.id } });
  }
}

export async function recordRoutineAssignment(tx: Tx, clientId: string, templateId: string | null, appliedBy: string) {
  if (!templateId) {
    await tx.client.update({ where: { id: clientId }, data: { activeRoutineAssignmentId: null } });
    return;
  }
  await tx.$queryRaw`SELECT id FROM plan_template WHERE id = ${templateId}::uuid FOR SHARE`;
  const revision = await ensureRoutineRevision(tx, templateId);
  const current = await tx.client.findUniqueOrThrow({ where: { id: clientId }, include: { activeRoutineAssignment: true } });
  if (current.activeRoutineAssignment?.revisionId === revision.id) return;
  const assignment = await tx.routineAssignment.create({ data: { clientId, revisionId: revision.id, appliedBy } });
  await tx.client.update({ where: { id: clientId }, data: { activeRoutineAssignmentId: assignment.id } });
}
