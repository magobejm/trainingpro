import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ClientRoutine, ClientRoutineWeek as WeekRow } from '@prisma/client';
import type { RoutineEditorItemKind, RoutineEditorItemMeta, RoutineEditorWeek } from '@trainerpro/shared';
import type { PrismaService } from '../../common/prisma/prisma.service';
import { todayKey } from '../plans/infra/prisma/client-routine.prisma';
import { prescriptionPatch } from './client-routine-prescription';
import { buildWeek } from './client-routine-view';

type Routine = ClientRoutine & { weeks: WeekRow[] };
type Row = Record<string, unknown> & { id: string };

/** The few delegate methods shared by every plan table, so one code path serves all block kinds. */
interface Table {
  count(args: object): Promise<number>;
  create(args: object): Promise<Row>;
  findFirst(args: object): Promise<Row | null>;
  findMany(args: object): Promise<Row[]>;
  findUniqueOrThrow(args: object): Promise<Row>;
  update(args: object): Promise<Row>;
}

const LIBRARY_COLUMN: Record<RoutineEditorItemKind, string> = {
  cardio: 'cardioMethodLibraryId',
  exercise: 'exerciseLibraryId',
  isometric: 'isometricExerciseLibraryId',
  mobility: 'mobilityExerciseLibraryId',
  plio: 'plioExerciseLibraryId',
  sport: 'sportLibraryId',
};

const ITEM_TABLES: Record<RoutineEditorItemKind, { item: string; parent: string; set: string }> = {
  cardio: { item: 'planCardioBlock', parent: 'blockId', set: 'planCardioSet' },
  exercise: { item: 'planStrengthExercise', parent: 'exerciseId', set: 'planStrengthSet' },
  isometric: { item: 'planIsometricBlock', parent: 'blockId', set: 'planIsometricSet' },
  mobility: { item: 'planMobilityBlock', parent: 'blockId', set: 'planMobilitySet' },
  plio: { item: 'planPlioBlock', parent: 'blockId', set: 'planPlioSet' },
  sport: { item: 'planSportBlock', parent: 'blockId', set: 'planSportSet' },
};

/** Columns every kind of set has in the database; the rest depend on the kind. */
const SET_COLUMNS: Record<RoutineEditorItemKind, string[]> = {
  cardio: [
    'advancedTechnique',
    'distanceMeters',
    'durationSeconds',
    'fcMaxPct',
    'fcMaxPctMax',
    'fcReservePct',
    'fcReservePctMax',
    'heartRate',
    'heartRateMax',
    'note',
    'restSeconds',
    'rpe',
  ],
  exercise: ['advancedTechnique', 'note', 'reps', 'restSeconds', 'rir', 'rpe', 'weightKg'],
  isometric: ['advancedTechnique', 'durationSeconds', 'note', 'restSeconds', 'rpe', 'weightKg'],
  mobility: ['advancedTechnique', 'note', 'reps', 'restSeconds', 'rom', 'rpe', 'weightKg'],
  plio: ['advancedTechnique', 'durationSeconds', 'note', 'reps', 'restSeconds', 'rpe', 'weightKg'],
  sport: [
    'advancedTechnique',
    'distanceMeters',
    'durationSeconds',
    'fcMaxPct',
    'fcMaxPctMax',
    'fcReservePct',
    'fcReservePctMax',
    'heartRate',
    'heartRateMax',
    'note',
    'reps',
    'restSeconds',
    'rir',
    'rom',
    'rpe',
    'weightKg',
  ],
};

const table = (prisma: PrismaService, name: string) => (prisma as unknown as Record<string, Table>)[name]!;
const itemTable = (prisma: PrismaService, kind: RoutineEditorItemKind) => table(prisma, ITEM_TABLES[kind].item);
const setTable = (prisma: PrismaService, kind: RoutineEditorItemKind) => table(prisma, ITEM_TABLES[kind].set);

function itemsOf(day: RoutineEditorWeek['days'][number], kind: RoutineEditorItemKind) {
  return kind === 'exercise' ? day.exercises : day.blocks.filter((block) => block.kind === kind);
}

/** The item itself, checked to belong to this week's template. Throws when the day is closed. */
export async function assertItem(
  prisma: PrismaService,
  routine: Routine,
  week: WeekRow,
  kind: RoutineEditorItemKind,
  id: string,
) {
  const row = await itemTable(prisma, kind).findFirst({
    select: { dayId: true },
    where: { archivedAt: null, day: { templateId: week.templateId }, id },
  });
  if (!row) throw new NotFoundException('Item not found in this week');
  const view = await buildWeek(prisma, routine, week, todayKey());
  const day = view.days.find((item) => item.id === row.dayId);
  if (!day) throw new NotFoundException('Day not found in this week');
  if (!day.editable) throw new ConflictException('This day is already finished and can no longer be edited');
  return day;
}

/** Ids of this item and of its copies in later weeks whose same day can still be edited. */
export async function twinIds(
  prisma: PrismaService,
  routine: Routine,
  week: WeekRow,
  kind: RoutineEditorItemKind,
  id: string,
) {
  const current = await itemTable(prisma, kind).findUniqueOrThrow({
    include: { day: { select: { dayIndex: true } } },
    where: { id },
  });
  const dayIndex = (current.day as { dayIndex: number }).dayIndex;
  const today = todayKey();
  const ids: string[] = [];
  const rows = routine.weeks.filter((item) => item.weekIndex >= week.weekIndex);
  for (const row of rows) {
    const view = await buildWeek(prisma, routine, row, today);
    const day = view.days.find((item) => item.dayIndex === dayIndex);
    if (!day?.editable) continue;
    const twin = itemsOf(day, kind).find(
      (item) => item.sortOrder === current.sortOrder && item.displayName === current.displayName,
    );
    if (twin) ids.push(twin.id);
  }
  return ids.length ? ids : [id];
}

function pickColumns(kind: RoutineEditorItemKind, patch: Record<string, unknown>) {
  const allowed = new Set(SET_COLUMNS[kind]);
  return Object.fromEntries(Object.entries(patch).filter(([key, value]) => allowed.has(key) && value !== undefined));
}

export async function patchItemSet(
  prisma: PrismaService,
  kind: RoutineEditorItemKind,
  setId: string,
  patch: Record<string, unknown>,
) {
  await setTable(prisma, kind).update({ data: pickColumns(kind, patch), where: { id: setId } });
}

/** Whether the set belongs to a (non archived) item of this week's template. */
export async function assertSetOf(prisma: PrismaService, kind: RoutineEditorItemKind, itemId: string, setId: string) {
  const found = await setTable(prisma, kind).findFirst({ where: { [ITEM_TABLES[kind].parent]: itemId, id: setId } });
  if (!found) throw new NotFoundException('Set not found in this item');
}

async function updatePlanned(prisma: PrismaService, kind: RoutineEditorItemKind, itemId: string) {
  if (kind !== 'exercise' && kind !== 'isometric') return;
  const count = await setTable(prisma, kind).count({ where: { [ITEM_TABLES[kind].parent]: itemId } });
  await itemTable(prisma, kind).update({ data: { setsPlanned: count }, where: { id: itemId } });
}

const SET_META = ['id', 'createdAt', 'updatedAt', 'setIndex', 'exerciseId', 'blockId'];

/** Appends a set that repeats the last one, on every copy of the item. */
export async function addItemSet(
  prisma: PrismaService,
  routine: Routine,
  week: WeekRow,
  kind: RoutineEditorItemKind,
  id: string,
) {
  const { parent } = ITEM_TABLES[kind];
  for (const target of await twinIds(prisma, routine, week, kind, id)) {
    const sets = await setTable(prisma, kind).findMany({ orderBy: { setIndex: 'asc' }, where: { [parent]: target } });
    const last = sets[sets.length - 1];
    const copy = Object.fromEntries(
      Object.entries(last ?? {}).filter(([key, value]) => !SET_META.includes(key) && value != null),
    );
    await setTable(prisma, kind).create({
      data: { ...copy, [parent]: target, setIndex: sets.length ? Number(last!.setIndex) + 1 : 0 },
    });
    await updatePlanned(prisma, kind, target);
  }
}

/** Closes the gap a deleted set leaves, keeping set indexes consecutive. */
async function reindex(prisma: PrismaService, kind: RoutineEditorItemKind, parentId: string) {
  const { parent } = ITEM_TABLES[kind];
  const sets = await setTable(prisma, kind).findMany({ orderBy: { setIndex: 'asc' }, where: { [parent]: parentId } });
  for (const [index, set] of sets.entries()) {
    if (set.setIndex !== index) await setTable(prisma, kind).update({ data: { setIndex: index }, where: { id: set.id } });
  }
}

/** Removes the set (and the one at the same position in later copies). Always keeps one set. */
export async function removeItemSet(
  prisma: PrismaService,
  routine: Routine,
  week: WeekRow,
  kind: RoutineEditorItemKind,
  id: string,
  setId: string,
) {
  const { parent } = ITEM_TABLES[kind];
  const sets = setTable(prisma, kind);
  const target = await sets.findFirst({ where: { [parent]: id, id: setId } });
  if (!target) throw new NotFoundException('Set not found in this item');
  if ((await sets.count({ where: { [parent]: id } })) <= 1) throw new ConflictException('An item needs at least one set');
  for (const twin of await twinIds(prisma, routine, week, kind, id)) {
    const same = await sets.findFirst({ where: { [parent]: twin, setIndex: target.setIndex } });
    if (!same || (await sets.count({ where: { [parent]: twin } })) <= 1) continue;
    await prismaDelete(prisma, kind, same.id);
    await reindex(prisma, kind, twin);
    await updatePlanned(prisma, kind, twin);
  }
}

function prismaDelete(prisma: PrismaService, kind: RoutineEditorItemKind, setId: string) {
  return (setTable(prisma, kind) as unknown as { delete(args: object): Promise<unknown> }).delete({ where: { id: setId } });
}

/** Swaps the movement for another of the same kind, here and in every later copy still editable. */
export async function swapItem(
  prisma: PrismaService,
  routine: Routine,
  week: WeekRow,
  kind: RoutineEditorItemKind,
  id: string,
  next: { displayName: string; libraryId: string },
) {
  const data = { displayName: next.displayName, [LIBRARY_COLUMN[kind]]: next.libraryId };
  for (const target of await twinIds(prisma, routine, week, kind, id)) {
    await itemTable(prisma, kind).update({ data, where: { id: target } });
  }
}

/** Notes, locks and the exercise-level prescription, on every copy of the item. */
export async function updateItemMeta(
  prisma: PrismaService,
  routine: Routine,
  week: WeekRow,
  kind: RoutineEditorItemKind,
  id: string,
  meta: RoutineEditorItemMeta,
) {
  for (const target of await twinIds(prisma, routine, week, kind, id)) {
    const row = await itemTable(prisma, kind).findUniqueOrThrow({ where: { id: target } });
    await itemTable(prisma, kind).update({ data: prescriptionPatch(kind, row, meta), where: { id: target } });
  }
}

/** Archives a non-strength block here and in later copies. */
export async function removeBlock(
  prisma: PrismaService,
  routine: Routine,
  week: WeekRow,
  kind: RoutineEditorItemKind,
  id: string,
) {
  for (const target of await twinIds(prisma, routine, week, kind, id)) {
    await itemTable(prisma, kind).update({ data: { archivedAt: new Date() }, where: { id: target } });
  }
}

const dropMeta = (row: Record<string, unknown>, extra: string[]) =>
  Object.fromEntries(
    Object.entries(row).filter(([key, value]) => value != null && !SET_META.includes(key) && !extra.includes(key)),
  );

/** Copies the item with all its sets at the end of the day, in every editable later week. */
export async function duplicateItem(
  prisma: PrismaService,
  routine: Routine,
  week: WeekRow,
  kind: RoutineEditorItemKind,
  id: string,
) {
  const today = todayKey();
  const source = await itemTable(prisma, kind).findUniqueOrThrow({
    include: { day: { select: { dayIndex: true } }, sets: { orderBy: { setIndex: 'asc' } } },
    where: { id },
  });
  const dayIndex = (source.day as { dayIndex: number }).dayIndex;
  const twins = new Set(await twinIds(prisma, routine, week, kind, id));
  for (const row of routine.weeks.filter((item) => item.weekIndex >= week.weekIndex)) {
    const view = await buildWeek(prisma, routine, row, today);
    const day = view.days.find((item) => item.dayIndex === dayIndex);
    if (!day?.editable || !itemsOf(day, kind).some((item) => twins.has(item.id))) continue;
    const last = [...day.exercises, ...day.blocks].reduce((max, item) => Math.max(max, item.sortOrder), -1);
    const sets = (source.sets as Row[]).map((set) => dropMeta(set, []));
    await itemTable(prisma, kind).create({
      data: {
        ...dropMeta(source, ['day', 'sets', 'groupId', 'archivedAt', 'dayId', 'sortOrder']),
        dayId: day.id,
        sets: { create: sets.map((set, index) => ({ ...set, setIndex: index })) },
        sortOrder: last + 1,
      },
    });
  }
}

type Ordered = { displayName: string; id: string; kind: RoutineEditorItemKind; sortOrder: number };
export type ItemMove = { direction: 'down' | 'up' } | { toIndex: number };

function dayOrder(day: RoutineEditorWeek['days'][number]): Ordered[] {
  const exercises = day.exercises.map((item) => ({ ...item, kind: 'exercise' as const }));
  return [...exercises, ...day.blocks].sort((a, b) => a.sortOrder - b.sortOrder);
}

function placeIndex(from: number, count: number, move: ItemMove) {
  const raw = 'toIndex' in move ? move.toIndex : from + (move.direction === 'up' ? -1 : 1);
  return Math.max(0, Math.min(raw, count - 1));
}

/** Keeps the day's existing positions, and separates duplicates so a move cannot collapse into a no-op. */
function uniqueRanks(ordered: Ordered[]) {
  const sorted = ordered.map((item) => item.sortOrder).sort((a, b) => a - b);
  let previous = -1;
  return sorted.map((value) => {
    const rank = Math.max(value, previous + 1);
    previous = rank;
    return rank;
  });
}

async function writeOrder(prisma: PrismaService, next: Ordered[], ranks: number[]) {
  for (const [index, item] of next.entries()) {
    if (item.sortOrder === ranks[index]) continue;
    await itemTable(prisma, item.kind).update({ data: { sortOrder: ranks[index] }, where: { id: item.id } });
  }
}

async function placeCopy(
  prisma: PrismaService,
  routine: Routine,
  row: WeekRow,
  dayIndex: number,
  identity: Ordered,
  move: ItemMove,
  today: string,
) {
  const view = await buildWeek(prisma, routine, row, today);
  const day = view.days.find((item) => item.dayIndex === dayIndex);
  if (!day?.editable) return;
  const ordered = dayOrder(day);
  const from = ordered.findIndex(
    (item) =>
      item.kind === identity.kind && item.sortOrder === identity.sortOrder && item.displayName === identity.displayName,
  );
  if (from < 0) return;
  const to = placeIndex(from, ordered.length, move);
  if (from === to) return;
  const next = ordered.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  await writeOrder(prisma, next, uniqueRanks(ordered));
}

/** Moves the item one step, or to an index, inside its day. Later open copies follow the same place. */
export async function moveItem(
  prisma: PrismaService,
  routine: Routine,
  week: WeekRow,
  kind: RoutineEditorItemKind,
  id: string,
  move: ItemMove,
) {
  const current = await itemTable(prisma, kind).findUniqueOrThrow({
    include: { day: { select: { dayIndex: true } } },
    where: { id },
  });
  const identity = {
    displayName: String(current.displayName),
    id,
    kind,
    sortOrder: Number(current.sortOrder),
  };
  const dayIndex = (current.day as { dayIndex: number }).dayIndex;
  const today = todayKey();
  for (const row of routine.weeks.filter((item) => item.weekIndex >= week.weekIndex)) {
    await placeCopy(prisma, routine, row, dayIndex, identity, move, today);
  }
}
