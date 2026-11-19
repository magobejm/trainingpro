import type { Prisma, ClientRoutine, ClientRoutineWeek as WeekRow } from '@prisma/client';
import { resolveLockedFields, type ExerciseBlockType } from '@trainerpro/shared';
import type { PrismaService } from '../../common/prisma/prisma.service';
import { todayKey } from '../plans/infra/prisma/client-routine.prisma';
import { buildWeek } from './client-routine-view';

type Routine = ClientRoutine & { weeks: WeekRow[] };
type Tx = Prisma.TransactionClient;

export const NEW_BLOCK_KINDS = ['cardio', 'isometric', 'mobility', 'plio', 'sport'] as const;
export type NewBlockKind = (typeof NEW_BLOCK_KINDS)[number];
export type NewBlock = { displayName: string; kind: NewBlockKind; libraryId: string };

const blank = (count: number) => Array.from({ length: count }, (_, setIndex) => ({ setIndex }));

function lockData(type: ExerciseBlockType): { lockedFieldsJson?: string[] } {
  const lockedFieldsJson = resolveLockedFields(type);
  return lockedFieldsJson.length > 0 ? { lockedFieldsJson } : {};
}

/** One block with simple starting values the coach then adjusts, like the 3 empty sets of a strength exercise. */
function createBlock(tx: Tx, dayId: string, sortOrder: number, input: NewBlock) {
  const base = { dayId, displayName: input.displayName, sortOrder };
  switch (input.kind) {
    case 'cardio':
      return tx.planCardioBlock.create({
        data: {
          ...base,
          cardioMethodLibraryId: input.libraryId,
          ...lockData('cardio'),
          sets: { create: [{ setIndex: 0 }] },
          workSeconds: 0,
        },
      });
    case 'isometric':
      return tx.planIsometricBlock.create({
        data: {
          ...base,
          isometricExerciseLibraryId: input.libraryId,
          ...lockData('isometric'),
          sets: { create: blank(3).map((set) => ({ ...set, durationSeconds: 30 })) },
          setsPlanned: 3,
        },
      });
    case 'mobility':
      return tx.planMobilityBlock.create({
        data: {
          ...base,
          ...lockData('mobility'),
          mobilityExerciseLibraryId: input.libraryId,
          sets: { create: blank(3) },
          workSeconds: 30,
        },
      });
    case 'plio':
      return tx.planPlioBlock.create({
        data: {
          ...base,
          ...lockData('plio'),
          plioExerciseLibraryId: input.libraryId,
          sets: { create: blank(3) },
          workSeconds: 30,
        },
      });
    case 'sport':
      return tx.planSportBlock.create({
        data: {
          ...base,
          ...lockData('sport'),
          durationMinutes: 30,
          sets: { create: blank(1) },
          sportLibraryId: input.libraryId,
        },
      });
  }
}

/** Adds the block to the day and to the same day of every later week that can still be edited. */
export async function addBlock(prisma: PrismaService, routine: Routine, week: WeekRow, dayIndex: number, input: NewBlock) {
  const today = todayKey();
  for (const row of routine.weeks.filter((item) => item.weekIndex >= week.weekIndex)) {
    const view = await buildWeek(prisma, routine, row, today);
    const day = view.days.find((item) => item.dayIndex === dayIndex);
    if (!day?.editable) continue;
    const last = day.blocks.reduce((max, block) => Math.max(max, block.sortOrder), -1);
    await prisma.$transaction(async (tx) => {
      await createBlock(tx, day.id, last + 1, input);
    });
  }
}
