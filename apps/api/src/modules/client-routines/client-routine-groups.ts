import { NotFoundException } from '@nestjs/common';
import type { ClientRoutine, ClientRoutineWeek as WeekRow } from '@prisma/client';
import { ExerciseGroupType } from '@prisma/client';
import type { RoutineEditorDay, RoutineEditorItemKind } from '@trainerpro/shared';
import type { PrismaService } from '../../common/prisma/prisma.service';
import { todayKey } from '../plans/infra/prisma/client-routine.prisma';
import { buildWeek } from './client-routine-view';

type Routine = ClientRoutine & { weeks: WeekRow[] };
type GroupType = 'CIRCUIT' | 'SUPERSET' | null;
export type GroupMember = { id: string; kind: RoutineEditorItemKind };
type Identity = GroupMember & { displayName: string; sortOrder: number };
type Writer = {
  planExerciseGroup: {
    create(args: object): Promise<{ id: string }>;
    deleteMany(args: object): Promise<unknown>;
    findMany(args: object): Promise<Array<{ id: string }>>;
  };
};

const MODEL: Record<RoutineEditorItemKind, string> = {
  cardio: 'planCardioBlock',
  exercise: 'planStrengthExercise',
  isometric: 'planIsometricBlock',
  mobility: 'planMobilityBlock',
  plio: 'planPlioBlock',
  sport: 'planSportBlock',
};

/**
 * Puts the given items of one day into a new superset or circuit, or takes them out of their group
 * when no type is given. Any mix of strength, cardio, plyometrics, mobility, sport and isometrics is
 * allowed. The same change is copied to the same day of every later week that is still editable.
 */
export async function setExerciseGroup(
  prisma: PrismaService,
  routine: Routine,
  week: WeekRow,
  dayIndex: number,
  input: { groupType: GroupType; items: GroupMember[] },
) {
  const today = todayKey();
  const sourceView = await buildWeek(prisma, routine, week, today);
  const sourceDay = sourceView.days.find((item) => item.dayIndex === dayIndex);
  if (!sourceDay?.editable) return;
  const source = identities(sourceDay, input.items);
  const later = routine.weeks.filter((item) => item.weekIndex >= week.weekIndex);
  for (const row of later) {
    const view = row.id === week.id ? sourceView : await buildWeek(prisma, routine, row, today);
    const day = view.days.find((item) => item.dayIndex === dayIndex);
    if (!day?.editable) continue;
    const members = row.id === week.id ? input.items : twins(day, source);
    if (members.length !== source.length) continue;
    await prisma.$transaction(async (tx) => {
      await writeGroup(tx as unknown as Writer, day.id, members, input.groupType);
    });
  }
}

function identities(day: RoutineEditorDay, items: GroupMember[]): Identity[] {
  return items.map((item) => {
    const found = findMember(day, item);
    if (!found) throw new NotFoundException('Item not found in this day');
    return found;
  });
}

function findMember(day: RoutineEditorDay, item: GroupMember): Identity | null {
  if (item.kind === 'exercise') {
    const exercise = day.exercises.find((candidate) => candidate.id === item.id);
    return exercise ? { ...item, displayName: exercise.displayName, sortOrder: exercise.sortOrder } : null;
  }
  const block = day.blocks.find((candidate) => candidate.kind === item.kind && candidate.id === item.id);
  return block ? { ...item, displayName: block.displayName, sortOrder: block.sortOrder } : null;
}

function twins(day: RoutineEditorDay, source: Identity[]): GroupMember[] {
  const found: GroupMember[] = [];
  for (const item of source) {
    const pool = item.kind === 'exercise' ? day.exercises : day.blocks.filter((block) => block.kind === item.kind);
    const match = pool.find(
      (candidate) => candidate.sortOrder === item.sortOrder && candidate.displayName === item.displayName,
    );
    if (!match) return [];
    found.push({ id: match.id, kind: item.kind });
  }
  return found;
}

async function writeGroup(tx: Writer, dayId: string, members: GroupMember[], groupType: GroupType) {
  for (const kind of Object.keys(MODEL) as RoutineEditorItemKind[]) {
    const ids = members.filter((item) => item.kind === kind).map((item) => item.id);
    if (ids.length) await rows(tx, kind).updateMany({ data: { groupId: null }, where: { id: { in: ids } } });
  }
  if (groupType && members.length >= 2) {
    const group = await tx.planExerciseGroup.create({
      data: { dayId, groupType: ExerciseGroupType[groupType] },
    });
    for (const kind of Object.keys(MODEL) as RoutineEditorItemKind[]) {
      const ids = members.filter((item) => item.kind === kind).map((item) => item.id);
      if (ids.length) await rows(tx, kind).updateMany({ data: { groupId: group.id }, where: { id: { in: ids } } });
    }
  }
  const empty = await tx.planExerciseGroup.findMany({
    select: { id: true },
    where: {
      cardioBlocks: { none: {} },
      dayId,
      isometricBlocks: { none: {} },
      mobilityBlocks: { none: {} },
      plioBlocks: { none: {} },
      sportBlocks: { none: {} },
      strengthExercises: { none: {} },
    },
  });
  if (empty.length) await tx.planExerciseGroup.deleteMany({ where: { id: { in: empty.map((group) => group.id) } } });
}

function rows(tx: Writer, kind: RoutineEditorItemKind) {
  return (tx as unknown as Record<string, { updateMany(args: object): Promise<unknown> }>)[MODEL[kind]]!;
}

/** Replaces the warm-ups of one day, and of the same day in every later week that is still editable. */
export async function setDayWarmups(
  prisma: PrismaService,
  routine: Routine,
  week: WeekRow,
  dayIndex: number,
  warmupTemplateIds: string[],
) {
  const today = todayKey();
  for (const row of routine.weeks.filter((item) => item.weekIndex >= week.weekIndex)) {
    const view = await buildWeek(prisma, routine, row, today);
    const day = view.days.find((item) => item.dayIndex === dayIndex);
    if (!day?.editable) continue;
    await prisma.$transaction([
      prisma.planDayWarmup.deleteMany({ where: { planDayId: day.id } }),
      prisma.planDayWarmup.createMany({
        data: warmupTemplateIds.map((warmupTemplateId, sortOrder) => ({ planDayId: day.id, sortOrder, warmupTemplateId })),
      }),
    ]);
  }
}
