import type { ClientRoutine, ClientRoutineWeek as WeekRow } from '@prisma/client';
import { ExerciseGroupType } from '@prisma/client';
import type { PrismaService } from '../../common/prisma/prisma.service';
import { todayKey } from '../plans/infra/prisma/client-routine.prisma';
import { buildWeek } from './client-routine-view';

type Routine = ClientRoutine & { weeks: WeekRow[] };

/**
 * Puts the given exercises of one day into a new superset or circuit, or takes them out of their group
 * when no type is given. The same change is copied to the same day of every later week that is still editable.
 */
export async function setExerciseGroup(
  prisma: PrismaService,
  routine: Routine,
  week: WeekRow,
  dayIndex: number,
  input: { exerciseIds: string[]; groupType: 'CIRCUIT' | 'SUPERSET' | null },
) {
  const source = await prisma.planStrengthExercise.findMany({
    select: { exerciseLibraryId: true, id: true, sortOrder: true },
    where: { archivedAt: null, id: { in: input.exerciseIds } },
  });
  const today = todayKey();
  const later = routine.weeks.filter((item) => item.weekIndex >= week.weekIndex);
  for (const row of later) {
    const view = await buildWeek(prisma, routine, row, today);
    const day = view.days.find((item) => item.dayIndex === dayIndex);
    if (!day?.editable) continue;
    const ids = source
      .map((item) =>
        day.exercises.find(
          (candidate) => candidate.sortOrder === item.sortOrder && candidate.exerciseLibraryId === item.exerciseLibraryId,
        ),
      )
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => item.id);
    if (ids.length !== source.length) continue;
    await prisma.$transaction(async (tx) => {
      await tx.planStrengthExercise.updateMany({ data: { groupId: null }, where: { id: { in: ids } } });
      if (input.groupType && ids.length >= 2) {
        const group = await tx.planExerciseGroup.create({
          data: { dayId: day.id, groupType: ExerciseGroupType[input.groupType] },
        });
        await tx.planStrengthExercise.updateMany({ data: { groupId: group.id }, where: { id: { in: ids } } });
      }
      const empty = await tx.planExerciseGroup.findMany({
        select: { id: true },
        where: {
          dayId: day.id,
          strengthExercises: { none: {} },
          cardioBlocks: { none: {} },
          plioBlocks: { none: {} },
          mobilityBlocks: { none: {} },
          sportBlocks: { none: {} },
          isometricBlocks: { none: {} },
        },
      });
      if (empty.length) await tx.planExerciseGroup.deleteMany({ where: { id: { in: empty.map((g) => g.id) } } });
    });
  }
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
