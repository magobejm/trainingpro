import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ClientRoutine, ClientRoutineWeek as WeekRow, Prisma, WarmupTemplateItem } from '@prisma/client';
import {
  resolveLockedFields,
  type ExerciseBlockType,
  type RoutineEditorDay,
  type RoutineEditorItemKind,
  type RoutineEditorItemMeta,
} from '@trainerpro/shared';
import { resolveWarmupItemSets, warmupItemMetadata } from '../../common/plan/client-warmups.mapper';
import type { PrismaService } from '../../common/prisma/prisma.service';
import { todayKey } from '../plans/infra/prisma/client-routine.prisma';
import { copyWarmupTemplate } from '../plans/infra/prisma/routine-revision.prisma';
import { pickColumns } from './client-routine-items';
import { prescriptionPatch } from './client-routine-prescription';
import { buildWeek } from './client-routine-view';
import { kindOfWarmupItem, lockedFieldsOfWarmupItem } from './client-routine-warmup-view';

type Tx = Prisma.TransactionClient;
type Routine = ClientRoutine & { weeks: WeekRow[] };
type Row = Record<string, unknown>;
type Scope = { day: RoutineEditorDay; routine: Routine; warmupId: string; week: WeekRow };
type Apply = (tx: Tx, itemId: string | null, current: boolean, warmupId: string) => Promise<void>;

const LIBRARY_COLUMN: Record<RoutineEditorItemKind, string> = {
  cardio: 'cardioMethodLibraryId',
  exercise: 'exerciseLibraryId',
  isometric: 'isometricExerciseLibraryId',
  mobility: 'mobilityExerciseLibraryId',
  plio: 'plioExerciseLibraryId',
  sport: 'sportLibraryId',
};

/**
 * Gives the day its own copy of the warm-up the first time it is edited. The library warm-up and the
 * frozen copy of the routine version are shared with other clients and are never written to.
 */
async function ownWarmup(tx: Tx, clientId: string, planDayWarmupId: string) {
  const reference = await tx.planDayWarmup.findUniqueOrThrow({
    include: { warmupTemplate: { include: { groups: true, items: { where: { archivedAt: null } } } } },
    where: { id: planDayWarmupId },
  });
  const template = reference.warmupTemplate;
  const alone = (await tx.planDayWarmup.count({ where: { warmupTemplateId: template.id } })) === 1;
  if (template.ownerClientId === clientId && alone) return { itemIds: new Map<string, string>(), templateId: template.id };
  const copy = await copyWarmupTemplate(tx, template, { ownerClientId: clientId });
  await tx.planDayWarmup.update({ data: { warmupTemplateId: copy.id }, where: { id: planDayWarmupId } });
  return { itemIds: copy.itemIds, templateId: copy.id };
}

/** The warm-up of this day and, when the edit follows later weeks, the matching one of each editable later week. */
async function targets(scope: Scope, prisma: PrismaService, propagate: boolean) {
  const { day, routine, warmupId, week } = scope;
  const position = day.warmups.findIndex((item) => item.id === warmupId);
  if (position < 0) throw new NotFoundException('Warm-up not found in this day');
  const found = [{ current: true, id: warmupId }];
  if (!propagate) return found;
  const name = day.warmups[position]!.name;
  const today = todayKey();
  for (const row of routine.weeks.filter((item) => item.weekIndex > week.weekIndex)) {
    const view = await buildWeek(prisma, routine, row, today);
    const later = view.days.find((item) => item.dayIndex === day.dayIndex);
    const twin = later?.editable ? later.warmups[position] : undefined;
    if (twin && twin.name === name) found.push({ current: false, id: twin.id });
  }
  return found;
}

/** Runs one change on the client's own copy of the warm-up, here and in the later weeks that follow it. */
async function run(scope: Scope, prisma: PrismaService, itemId: string | null, propagate: boolean, apply: Apply) {
  const source = itemId
    ? await prisma.warmupTemplateItem.findFirst({
        where: { archivedAt: null, id: itemId, template: { dayWarmups: { some: { id: scope.warmupId } } } },
      })
    : null;
  if (itemId && !source) throw new NotFoundException('Exercise not found in this warm-up');
  for (const target of await targets(scope, prisma, propagate)) {
    await prisma.$transaction(async (tx) => {
      const own = await ownWarmup(tx, scope.routine.clientId, target.id);
      if (!source) return apply(tx, null, target.current, target.id);
      const id = target.current
        ? (own.itemIds.get(source.id) ?? source.id)
        : (
            await tx.warmupTemplateItem.findFirst({
              select: { id: true },
              where: {
                archivedAt: null,
                blockType: source.blockType,
                displayName: source.displayName,
                sortOrder: source.sortOrder,
                templateId: own.templateId,
              },
            })
          )?.id;
      if (id) await apply(tx, id, target.current, target.id);
    });
  }
}

const sheetOf = (item: WarmupTemplateItem) => resolveWarmupItemSets(item).sets as unknown as Row[];

/** Rewrites the sets stored inside the exercise; every set is kept explicit so no value falls back by surprise. */
async function writeSets(tx: Tx, id: string, change: (sets: Row[], item: WarmupTemplateItem) => Row[]) {
  const item = await tx.warmupTemplateItem.findUniqueOrThrow({ where: { id } });
  const sets = change(sheetOf(item), item);
  const metadataJson = {
    ...(warmupItemMetadata(item) ?? {}),
    lockedFields: lockedFieldsOfWarmupItem(item),
    sets,
    setVariablesVersion: 2,
  } as unknown as Prisma.InputJsonObject;
  await tx.warmupTemplateItem.update({ data: { metadataJson, setsPlanned: sets.length }, where: { id } });
}

function setIndexOf(itemId: string, setId: string) {
  const [owner, index] = setId.split(':');
  if (owner !== itemId || !/^\d+$/.test(index ?? '')) throw new NotFoundException('Set not found in this exercise');
  return Number(index);
}

/** The value of one set. Like set values elsewhere in the routine, it only changes this week. */
export async function patchWarmupSet(scope: Scope, prisma: PrismaService, itemId: string, setId: string, patch: Row) {
  const index = setIndexOf(itemId, setId);
  await run(scope, prisma, itemId, false, (tx, id) =>
    writeSets(tx, id!, (sets, item) => {
      if (!sets.some((set) => set.setIndex === index)) throw new NotFoundException('Set not found in this exercise');
      const columns = pickColumns(kindOfWarmupItem(item.blockType), patch);
      return sets.map((set) => (set.setIndex === index ? { ...set, ...columns } : set));
    }),
  );
}

/** Appends a set that repeats the last one. */
export async function addWarmupSet(scope: Scope, prisma: PrismaService, itemId: string) {
  await run(scope, prisma, itemId, true, (tx, id) =>
    writeSets(tx, id!, (sets) => {
      const last = sets[sets.length - 1];
      return [...sets, { ...(last ?? {}), setIndex: sets.length }];
    }),
  );
}

/** Removes a set. The exercise always keeps one. */
export async function removeWarmupSet(scope: Scope, prisma: PrismaService, itemId: string, setId: string) {
  const index = setIndexOf(itemId, setId);
  await run(scope, prisma, itemId, true, (tx, id, current) =>
    writeSets(tx, id!, (sets) => {
      if (sets.length <= 1) {
        if (current) throw new ConflictException('An exercise needs at least one set');
        return sets;
      }
      if (current && !sets.some((set) => set.setIndex === index))
        throw new NotFoundException('Set not found in this exercise');
      return sets.filter((set) => set.setIndex !== index).map((set, position) => ({ ...set, setIndex: position }));
    }),
  );
}

/** Notes, locked variables and the exercise-level prescription. */
export async function updateWarmupItemMeta(
  scope: Scope,
  prisma: PrismaService,
  itemId: string,
  meta: RoutineEditorItemMeta,
) {
  await run(scope, prisma, itemId, true, async (tx, id) => {
    const item = await tx.warmupTemplateItem.findUniqueOrThrow({ where: { id: id! } });
    const { lockedFieldsJson, ...columns } = prescriptionPatch(kindOfWarmupItem(item.blockType), item, meta) as {
      lockedFieldsJson?: string[];
    } & Row;
    const metadataJson =
      lockedFieldsJson === undefined
        ? {}
        : {
            metadataJson: {
              ...(warmupItemMetadata(item) ?? {}),
              lockedFields: lockedFieldsJson,
              setVariablesVersion: 2,
            } as unknown as Prisma.InputJsonObject,
          };
    await tx.warmupTemplateItem.update({
      data: { ...columns, ...metadataJson } as Prisma.WarmupTemplateItemUncheckedUpdateInput,
      where: { id: id! },
    });
  });
}

/** Swaps the movement for another of the same kind. */
export async function swapWarmupItem(
  scope: Scope,
  prisma: PrismaService,
  itemId: string,
  next: { displayName: string; libraryId: string },
) {
  await run(scope, prisma, itemId, true, async (tx, id) => {
    const item = await tx.warmupTemplateItem.findUniqueOrThrow({ where: { id: id! } });
    const column = LIBRARY_COLUMN[kindOfWarmupItem(item.blockType)];
    await tx.warmupTemplateItem.update({
      data: { displayName: next.displayName, [column]: next.libraryId } as Prisma.WarmupTemplateItemUncheckedUpdateInput,
      where: { id: id! },
    });
  });
}

export async function removeWarmupItem(scope: Scope, prisma: PrismaService, itemId: string) {
  await run(scope, prisma, itemId, true, async (tx, id) => {
    await tx.warmupTemplateItem.delete({ where: { id: id! } });
  });
}

const START_SETS: Record<RoutineEditorItemKind, number> = {
  cardio: 1,
  exercise: 3,
  isometric: 3,
  mobility: 3,
  plio: 3,
  sport: 1,
};

/** Adds an exercise from the library at the end of the warm-up. */
export async function addWarmupItem(
  scope: Scope,
  prisma: PrismaService,
  input: { displayName: string; kind: RoutineEditorItemKind; libraryId: string },
) {
  const blockType = (input.kind === 'exercise' ? 'strength' : input.kind) as ExerciseBlockType;
  await run(scope, prisma, null, true, async (tx, _id, _current, warmupId) => {
    const reference = await tx.planDayWarmup.findUniqueOrThrow({
      select: { warmupTemplateId: true },
      where: { id: warmupId },
    });
    const last = await tx.warmupTemplateItem.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
      where: { archivedAt: null, templateId: reference.warmupTemplateId },
    });
    const count = START_SETS[input.kind];
    await tx.warmupTemplateItem.create({
      data: {
        [LIBRARY_COLUMN[input.kind]]: input.libraryId,
        blockType,
        displayName: input.displayName,
        metadataJson: {
          lockedFields: resolveLockedFields(blockType),
          sets: Array.from({ length: count }, (_, setIndex) => ({ setIndex })),
          setVariablesVersion: 2,
        },
        setsPlanned: count,
        sortOrder: (last?.sortOrder ?? -1) + 1,
        templateId: reference.warmupTemplateId,
      } as Prisma.WarmupTemplateItemUncheckedCreateInput,
    });
  });
}
