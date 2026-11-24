import type { ClientRoutine, ClientRoutineWeek as WeekRow, Prisma } from '@prisma/client';
import {
  isDayEditable,
  isoDate,
  resolveLockedFields,
  sessionOutcome,
  weekLock,
  type ExerciseBlockType,
  type RoutineEditorBlock,
  type RoutineEditorTimedSet,
  type RoutineEditorDay,
  type RoutineEditorExercise,
  type RoutineEditorLogged,
  type RoutineEditorSet,
  type RoutineEditorWeek,
  type SessionOutcome,
} from '@trainerpro/shared';
import type { PrismaService } from '../../common/prisma/prisma.service';
import { clientRoutineTemplateIds } from '../plans/infra/prisma/client-routine.prisma';
import { readPrescription } from './client-routine-prescription';
import { warmupItemView } from './client-routine-warmup-view';

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
const timedInclude = { ...blockInclude, include: { sets: { orderBy: { setIndex: 'asc' as const } } } };

type TimedSource = { sets?: Array<Record<string, unknown> & { id: string; setIndex: number }> };

const text = (value: unknown) => (typeof value === 'string' ? value : null);
const whole = (value: unknown) => (value == null ? null : Number(value));

function timedSets(block: object): RoutineEditorTimedSet[] {
  return ((block as TimedSource).sets ?? []).map((set) => ({
    advancedTechnique: text(set.advancedTechnique),
    distanceMeters: whole(set.distanceMeters),
    durationSeconds: whole(set.durationSeconds),
    fcMaxPct: whole(set.fcMaxPct),
    fcMaxPctMax: whole(set.fcMaxPctMax),
    fcReservePct: whole(set.fcReservePct),
    fcReservePctMax: whole(set.fcReservePctMax),
    heartRate: whole(set.heartRate),
    heartRateMax: whole(set.heartRateMax),
    id: set.id,
    note: text(set.note),
    reps: whole(set.reps),
    restSeconds: whole(set.restSeconds),
    rir: whole(set.rir),
    rom: text(set.rom),
    rpe: whole(set.rpe),
    setIndex: set.setIndex,
    weightKg: whole(set.weightKg),
  }));
}

/** Variables the coach marked as filled in by the client. */
function lockedList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function shownLocks(type: ExerciseBlockType, value: unknown): string[] {
  return resolveLockedFields(type, lockedList(value));
}
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
        cardioBlocks: timedInclude,
        exerciseGroups: { orderBy: { sortOrder: 'asc' } },
        exercises: { ...blockInclude, include: { sets: { orderBy: { setIndex: 'asc' } } } },
        isometricBlocks: timedInclude,
        mobilityBlocks: timedInclude,
        plioBlocks: timedInclude,
        sportBlocks: timedInclude,
        warmups: {
          include: {
            warmupTemplate: {
              select: { items: { orderBy: { sortOrder: 'asc' }, where: { archivedAt: null } }, name: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
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
        planDay: { templateId: { in: clientRoutineTemplateIds(routine) } },
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

type LoadedDay = Awaited<ReturnType<typeof loadWeekData>>[0][number];

function editorDay(
  day: LoadedDay,
  context: {
    dates: string[];
    editable: boolean;
    extra: boolean;
    logged: LoggedItem[];
    outcome: SessionOutcome | null;
    planned: boolean;
  },
): RoutineEditorDay {
  const matches = matchLogged(day.exercises, context.logged);
  const exercises = day.exercises.map((exercise, position) => {
    const logged = context.outcome === 'skipped' ? null : (matches[position] ?? null);
    return exerciseView(exercise, logged);
  });
  const blocks = BLOCK_KINDS.flatMap(([key, kind]) => day[key].map((block) => blockView(block, kind))).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  return {
    blocks,
    dayIndex: day.dayIndex,
    editable: context.editable,
    exercises,
    extra: context.extra,
    groups: day.exerciseGroups.map((group) => ({ groupType: group.groupType, id: group.id, note: group.note })),
    id: day.id,
    outcome: context.outcome,
    planned: context.planned,
    scheduledDates: [...context.dates].sort(),
    title: day.title,
    warmups: day.warmups.map((item) => ({
      id: item.id,
      items: item.warmupTemplate.items.map(warmupItemView),
      name: item.warmupTemplate.name,
      warmupTemplateId: item.warmupTemplateId,
    })),
  };
}

function exerciseView(exercise: LoadedDay['exercises'][number], item: LoggedItem | null): RoutineEditorExercise {
  const prescribed = readPrescription('exercise', exercise);
  return {
    displayName: exercise.displayName,
    durationMinutes: prescribed.durationMinutes,
    exerciseLibraryId: exercise.exerciseLibraryId,
    groupId: exercise.groupId,
    id: exercise.id,
    lockedFields: shownLocks('strength', exercise.lockedFieldsJson),
    notes: prescribed.notes,
    repsRange: prescribed.repsRange,
    restSeconds: exercise.restSeconds,
    sets: exercise.sets.map((set) => strengthSet(set, item)),
    sortOrder: exercise.sortOrder,
  };
}

function strengthSet(set: LoadedDay['exercises'][number]['sets'][number], item: LoggedItem | null): RoutineEditorSet {
  return {
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
  };
}

type BlockRow = LoadedDay['cardioBlocks' | 'isometricBlocks' | 'mobilityBlocks' | 'plioBlocks' | 'sportBlocks'][number];

function blockView(block: BlockRow, kind: RoutineEditorBlock['kind']): RoutineEditorBlock {
  const prescribed = readPrescription(kind, block);
  return {
    displayName: block.displayName,
    durationMinutes: prescribed.durationMinutes,
    groupId: block.groupId,
    id: block.id,
    kind,
    lockedFields: shownLocks(kind, block.lockedFieldsJson),
    notes: prescribed.notes,
    repsRange: prescribed.repsRange,
    sets: timedSets(block),
    sortOrder: block.sortOrder,
  };
}

export async function buildWeek(
  prisma: PrismaService,
  routine: ClientRoutine,
  week: WeekRow,
  today: string,
): Promise<RoutineEditorWeek> {
  const { from, to } = weekWindow(routine, week);
  const [days, events, sessions] = await loadWeekData(prisma, routine, week, from, to);
  const libraryIndexes = new Set(
    (
      await prisma.planDay.findMany({
        distinct: ['dayIndex'],
        select: { dayIndex: true },
        where: { templateId: routine.sourceTemplateId },
      })
    ).map((row) => row.dayIndex),
  );
  const neats = (
    await prisma.planTemplateNeat.findMany({
      orderBy: { sortOrder: 'asc' },
      where: { archivedAt: null, templateId: week.templateId },
    })
  ).map((row) => ({ description: row.description ?? '', id: row.id, title: row.title }));
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
    days: days.map((day) =>
      editorDay(day, {
        dates: scheduled.get(day.dayIndex) ?? [],
        editable: isDayEditable(lock, day.dayIndex),
        extra: !libraryIndexes.has(day.dayIndex),
        logged: itemsByDay.get(day.dayIndex) ?? [],
        outcome: outcomes.get(day.dayIndex) ?? null,
        planned: scheduled.has(day.dayIndex),
      }),
    ),
    endsOn: to,
    id: week.id,
    neats,
    phase: lock.phase,
    readOnly: lock.readOnly,
    startsOn: from,
    weekIndex: week.weekIndex,
  };
}
