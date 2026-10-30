import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ClientRoutine, ClientRoutineWeek as WeekRow } from '@prisma/client';
import type { RoutineEditorSetPatch, RoutineEditorWeek } from '@trainerpro/shared';
import type { PrismaService } from '../../common/prisma/prisma.service';
import { todayKey } from '../plans/infra/prisma/client-routine.prisma';
import { buildWeek } from './client-routine-view';

type Routine = ClientRoutine & { weeks: WeekRow[] };

/** Weeks from the given one onward, with each one's view, so edits can skip anything already locked. */
async function laterWeeks(prisma: PrismaService, routine: Routine, fromIndex: number) {
  const rows = routine.weeks.filter((week) => week.weekIndex >= fromIndex).sort((a, b) => a.weekIndex - b.weekIndex);
  const today = todayKey();
  return Promise.all(rows.map(async (row) => ({ row, view: await buildWeek(prisma, routine, row, today) })));
}

function editableDay(view: RoutineEditorWeek, dayIndex: number) {
  const day = view.days.find((item) => item.dayIndex === dayIndex);
  return day?.editable ? day : null;
}

/** Throws unless the day (inside this very week) is still open for edits. */
export async function assertEditable(prisma: PrismaService, routine: Routine, week: WeekRow, dayId: string) {
  const view = await buildWeek(prisma, routine, week, todayKey());
  const day = view.days.find((item) => item.id === dayId);
  if (!day) throw new NotFoundException('Day not found in this week');
  if (!day.editable) throw new ConflictException('This day is already finished and can no longer be edited');
  return day;
}

export async function patchSet(prisma: PrismaService, setId: string, patch: RoutineEditorSetPatch) {
  const { reps, restSeconds, rir, rpe, weightKg, advancedTechnique, note } = patch;
  await prisma.planStrengthSet.update({
    data: { advancedTechnique, note, reps, restSeconds, rir, rpe, weightKg },
    where: { id: setId },
  });
}

export type NewExercise = {
  displayName: string;
  exerciseLibraryId: string;
  sets: Array<{
    reps?: number | null;
    restSeconds?: number | null;
    rir?: number | null;
    rpe?: number | null;
    weightKg?: number | null;
  }>;
};

/** Adds the exercise to the day and to the same day of every later week that can still be edited. */
export async function addExercise(
  prisma: PrismaService,
  routine: Routine,
  week: WeekRow,
  dayIndex: number,
  input: NewExercise,
) {
  for (const { view } of await laterWeeks(prisma, routine, week.weekIndex)) {
    const day = editableDay(view, dayIndex);
    if (!day) continue;
    const last = day.exercises.reduce((max, item) => Math.max(max, item.sortOrder), -1);
    await prisma.planStrengthExercise.create({
      data: {
        dayId: day.id,
        displayName: input.displayName,
        exerciseLibraryId: input.exerciseLibraryId,
        sets: { create: input.sets.map((set, index) => ({ ...set, setIndex: index })) },
        setsPlanned: input.sets.length,
        sortOrder: last + 1,
      },
    });
  }
}

/** Swaps the movement from this week onward. Earlier weeks keep the old one, so progress shows both. */
export async function replaceExercise(
  prisma: PrismaService,
  routine: Routine,
  week: WeekRow,
  exerciseId: string,
  next: { displayName: string; exerciseLibraryId: string },
) {
  const current = await prisma.planStrengthExercise.findUniqueOrThrow({
    include: { day: { select: { dayIndex: true } } },
    where: { id: exerciseId },
  });
  for (const { view } of await laterWeeks(prisma, routine, week.weekIndex)) {
    const day = editableDay(view, current.day.dayIndex);
    const target = day?.exercises.find(
      (item) => item.sortOrder === current.sortOrder && item.exerciseLibraryId === current.exerciseLibraryId,
    );
    if (!target) continue;
    await prisma.planStrengthExercise.update({
      data: { displayName: next.displayName, exerciseLibraryId: next.exerciseLibraryId },
      where: { id: target.id },
    });
  }
}

export async function removeExercise(prisma: PrismaService, routine: Routine, week: WeekRow, exerciseId: string) {
  const current = await prisma.planStrengthExercise.findUniqueOrThrow({
    include: { day: { select: { dayIndex: true } } },
    where: { id: exerciseId },
  });
  for (const { view } of await laterWeeks(prisma, routine, week.weekIndex)) {
    const day = editableDay(view, current.day.dayIndex);
    const target = day?.exercises.find(
      (item) => item.sortOrder === current.sortOrder && item.exerciseLibraryId === current.exerciseLibraryId,
    );
    if (target) await prisma.planStrengthExercise.update({ data: { archivedAt: new Date() }, where: { id: target.id } });
  }
}
