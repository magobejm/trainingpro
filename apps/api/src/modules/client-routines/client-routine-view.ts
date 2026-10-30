import type { ClientRoutine, ClientRoutineWeek as WeekRow, Prisma } from '@prisma/client';
import {
  isDayEditable,
  isoDate,
  sessionOutcome,
  weekLock,
  type RoutineEditorBlock,
  type RoutineEditorDay,
  type RoutineEditorExercise,
  type RoutineEditorLogged,
  type RoutineEditorSet,
  type RoutineEditorWeek,
  type SessionOutcome,
} from '@trainerpro/shared';
import type { PrismaService } from '../../common/prisma/prisma.service';

const DAY_MS = 86_400_000;
const num = (value: Prisma.Decimal | number | null | undefined) => (value == null ? null : Number(value));
const date = (value: Date) => value.toISOString().slice(0, 10);

export function weekWindow(routine: Pick<ClientRoutine, 'cycleDays'>, week: Pick<WeekRow, 'startsOn'>) {
  const from = date(week.startsOn);
  return { from, to: isoDate(Math.floor(new Date(`${from}T00:00:00Z`).getTime() / DAY_MS) + routine.cycleDays - 1) };
}

const BLOCK_KINDS = [
  ['cardioBlocks', 'cardio'],
  ['plioBlocks', 'plio'],
  ['mobilityBlocks', 'mobility'],
  ['sportBlocks', 'sport'],
  ['isometricBlocks', 'isometric'],
] as const;

const blockInclude = { where: { archivedAt: null }, orderBy: { sortOrder: 'asc' as const } };

function loggedFor(
  logs: Array<{ setIndex: number } & Record<string, unknown>>,
  setIndex: number,
): RoutineEditorLogged | null {
  const log = logs.find((item) => item.setIndex === setIndex) as
    | {
        effortRir: number | null;
        effortRpe: Prisma.Decimal | null;
        repsDone: number | null;
        restSecondsDone: number | null;
        weightDoneKg: Prisma.Decimal | null;
      }
    | undefined;
  if (!log) return null;
  return {
    reps: log.repsDone,
    restSeconds: log.restSecondsDone,
    rir: log.effortRir,
    rpe: num(log.effortRpe),
    weightKg: num(log.weightDoneKg),
  };
}

type LoggedItem = {
  displayName: string;
  logs: Array<{ setIndex: number } & Record<string, unknown>>;
  sourceExerciseId: string | null;
};

/** Pairs each prescribed exercise with the item the client logged, in order, so repeated exercises line up. */
function matchLogged(exercises: Array<{ displayName: string; exerciseLibraryId: string | null }>, items: LoggedItem[]) {
  const taken = new Set<LoggedItem>();
  return exercises.map((exercise) => {
    const found = items.find(
      (item) =>
        !taken.has(item) &&
        (exercise.exerciseLibraryId
          ? item.sourceExerciseId === exercise.exerciseLibraryId
          : item.displayName === exercise.displayName),
    );
    if (found) taken.add(found);
    return found ?? null;
  });
}

async function loadWeekData(prisma: PrismaService, routine: ClientRoutine, week: WeekRow, from: string, to: string) {
  return Promise.all([
    prisma.planDay.findMany({
      include: {
        cardioBlocks: blockInclude,
        exerciseGroups: { orderBy: { sortOrder: 'asc' } },
        exercises: { ...blockInclude, include: { sets: { orderBy: { setIndex: 'asc' } } } },
        isometricBlocks: blockInclude,
        mobilityBlocks: blockInclude,
        plioBlocks: blockInclude,
        sportBlocks: blockInclude,
      },
      orderBy: { dayIndex: 'asc' },
      where: { archivedAt: null, revisionVersion: 1, templateId: week.templateId },
    }),
    prisma.calendarEvent.findMany({
      select: { date: true, planDay: { select: { dayIndex: true } } },
      where: {
        archivedAt: null,
        clientId: routine.clientId,
        date: { gte: new Date(from), lte: new Date(to) },
        planDay: { templateId: routine.sourceTemplateId },
        type: 'workout',
      },
    }),
    prisma.sessionInstance.findMany({
      include: { items: { include: { logs: true }, where: { archivedAt: null }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'asc' },
      where: {
        archivedAt: null,
        clientId: routine.clientId,
        sessionDate: { gte: new Date(from), lte: new Date(to) },
        sourceTemplateId: routine.sourceTemplateId,
      },
    }),
  ]);
}

export async function buildWeek(
  prisma: PrismaService,
  routine: ClientRoutine,
  week: WeekRow,
  today: string,
): Promise<RoutineEditorWeek> {
  const { from, to } = weekWindow(routine, week);
  const [days, events, sessions] = await loadWeekData(prisma, routine, week, from, to);
  const scheduled = new Map<number, string[]>();
  for (const event of events) {
    const index = event.planDay?.dayIndex;
    if (index != null) scheduled.set(index, [...(scheduled.get(index) ?? []), date(event.date)]);
  }
  const outcomes = new Map<number, SessionOutcome>();
  const itemsByDay = new Map<number, LoggedItem[]>();
  for (const session of sessions) {
    if (session.planDayIndex == null) continue;
    outcomes.set(session.planDayIndex, sessionOutcome(session));
    itemsByDay.set(session.planDayIndex, [...(itemsByDay.get(session.planDayIndex) ?? []), ...session.items]);
  }
  const planned = days.filter((day) => scheduled.has(day.dayIndex)).map((day) => day.dayIndex);
  const lock = weekLock({
    cycleDays: routine.cycleDays,
    days: (planned.length ? planned : days.map((day) => day.dayIndex)).map((dayIndex) => ({
      dayIndex,
      outcome: outcomes.get(dayIndex),
    })),
    startsOn: from,
    today,
  });
  return {
    days: days.map((day): RoutineEditorDay => {
      const outcome = outcomes.get(day.dayIndex) ?? null;
      const matches = matchLogged(day.exercises, itemsByDay.get(day.dayIndex) ?? []);
      const skipped = outcome === 'skipped';
      const exercises = day.exercises.map((exercise, position): RoutineEditorExercise => {
        const item = skipped ? null : matches[position];
        return {
          displayName: exercise.displayName,
          exerciseLibraryId: exercise.exerciseLibraryId,
          groupId: exercise.groupId,
          id: exercise.id,
          notes: exercise.notes,
          restSeconds: exercise.restSeconds,
          sets: exercise.sets.map(
            (set): RoutineEditorSet => ({
              advancedTechnique: set.advancedTechnique,
              id: set.id,
              logged: item ? loggedFor(item.logs, set.setIndex) : null,
              note: set.note,
              reps: set.reps,
              restSeconds: set.restSeconds,
              rir: set.rir,
              rpe: num(set.rpe),
              setIndex: set.setIndex,
              weightKg: num(set.weightKg),
            }),
          ),
          sortOrder: exercise.sortOrder,
        };
      });
      const blocks: RoutineEditorBlock[] = BLOCK_KINDS.flatMap(([key, kind]) =>
        day[key].map((block) => ({ displayName: block.displayName, id: block.id, kind, sortOrder: block.sortOrder })),
      ).sort((a, b) => a.sortOrder - b.sortOrder);
      return {
        blocks,
        dayIndex: day.dayIndex,
        editable: isDayEditable(lock, day.dayIndex),
        exercises,
        groups: day.exerciseGroups.map((group) => ({ groupType: group.groupType, id: group.id, note: group.note })),
        id: day.id,
        outcome,
        planned: scheduled.has(day.dayIndex),
        scheduledDates: (scheduled.get(day.dayIndex) ?? []).sort(),
        title: day.title,
      };
    }),
    endsOn: to,
    id: week.id,
    phase: lock.phase,
    readOnly: lock.readOnly,
    startsOn: from,
    weekIndex: week.weekIndex,
  };
}
