/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;
type Spec = { rel: string; children?: Spec[] };

const BLOCK_CHILDREN: Spec[] = [{ rel: 'fieldModes' }, { rel: 'sets' }];
/** Groups come first so the blocks can be pointed at the copied groups. */
const DAY_TREE: Spec[] = [
  { rel: 'warmups' },
  { rel: 'exerciseGroups' },
  { rel: 'exercises', children: BLOCK_CHILDREN },
  { rel: 'cardioBlocks', children: BLOCK_CHILDREN },
  { rel: 'plioBlocks', children: BLOCK_CHILDREN },
  { rel: 'mobilityBlocks', children: BLOCK_CHILDREN },
  { rel: 'sportBlocks', children: BLOCK_CHILDREN },
  { rel: 'isometricBlocks', children: BLOCK_CHILDREN },
];

const models = new Map(Prisma.dmmf.datamodel.models.map((model) => [model.name, model]));

function field(modelName: string, name: string) {
  const found = models.get(modelName)?.fields.find((item) => item.name === name);
  if (!found) throw new Error(`Unknown field ${modelName}.${name}`);
  return found;
}

function foreignKeyOf(childModel: string, relationName: string): string {
  const back = models
    .get(childModel)
    ?.fields.find((item) => item.relationName === relationName && item.relationFromFields?.length);
  const key = back?.relationFromFields?.[0];
  if (!key) throw new Error(`No foreign key for ${childModel}/${relationName}`);
  return key;
}

function delegate(tx: Tx, modelName: string): any {
  return (tx as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
}

function includeFor(specs: Spec[]): Record<string, unknown> {
  return Object.fromEntries(specs.map((spec) => [spec.rel, spec.children ? { include: includeFor(spec.children) } : true]));
}

function scalars(modelName: string, row: any, drop: string[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const item of models.get(modelName)!.fields) {
    if (item.kind === 'object' || drop.includes(item.name) || ['id', 'createdAt', 'updatedAt'].includes(item.name)) continue;
    const value = row[item.name];
    data[item.name] = value === null && item.type === 'Json' ? Prisma.DbNull : value;
  }
  return data;
}

async function cloneChildren(
  tx: Tx,
  modelName: string,
  row: any,
  newId: string,
  specs: Spec[],
  groups: Map<string, string>,
) {
  for (const spec of specs) {
    const relation = field(modelName, spec.rel);
    const childModel = relation.type;
    const fk = foreignKeyOf(childModel, relation.relationName!);
    for (const child of row[spec.rel] ?? []) {
      if (child.archivedAt) continue;
      const data = scalars(childModel, child, [fk]);
      data[fk] = newId;
      if ('groupId' in data && childModel !== 'PlanDayWarmup') data.groupId = groups.get(child.groupId) ?? null;
      const created = await delegate(tx, childModel).create({ data, select: { id: true } });
      if (childModel === 'PlanExerciseGroup') groups.set(child.id, created.id);
      await cloneChildren(tx, childModel, child, created.id, spec.children ?? [], groups);
    }
  }
}

/** Copies the current revision of a routine into a new template owned by one client. */
export async function cloneTemplateForClient(
  tx: Tx,
  input: { sourceTemplateId: string; clientId: string; actorId: string },
): Promise<string> {
  const source: any = await tx.planTemplate.findUniqueOrThrow({
    where: { id: input.sourceTemplateId },
    include: { neats: true, routineObjectives: true },
  });
  const client = await tx.client.findUniqueOrThrow({
    where: { id: input.clientId },
    select: { coachMembershipId: true, organizationId: true },
  });
  const copy = await tx.planTemplate.create({
    data: {
      coachMembershipId: client.coachMembershipId,
      createdBy: input.actorId,
      expectedCompletionDays: source.expectedCompletionDays,
      kind: source.kind,
      mesocycleMicrocycles: source.mesocycleMicrocycles,
      name: source.name,
      organizationId: client.organizationId,
      ownerClientId: input.clientId,
      scope: 'COACH',
      updatedBy: input.actorId,
    },
    select: { id: true },
  });
  for (const neat of source.neats)
    await tx.planTemplateNeat.create({
      data: { templateId: copy.id, title: neat.title, description: neat.description, sortOrder: neat.sortOrder },
    });
  for (const item of source.routineObjectives)
    await tx.planTemplateObjective.create({ data: { templateId: copy.id, objectiveId: item.objectiveId } });
  const days = await tx.planDay.findMany({
    where: { templateId: source.id, revisionVersion: source.templateVersion, archivedAt: null },
    include: includeFor(DAY_TREE) as any,
    orderBy: { dayIndex: 'asc' },
  });
  for (const day of days) {
    const row: any = day;
    const data = scalars('PlanDay', row, ['templateId', 'revisionVersion']);
    const created = await tx.planDay.create({
      data: { ...(data as any), templateId: copy.id, revisionVersion: 1 },
      select: { id: true },
    });
    await cloneChildren(tx, 'PlanDay', row, created.id, DAY_TREE, new Map());
  }
  return copy.id;
}
