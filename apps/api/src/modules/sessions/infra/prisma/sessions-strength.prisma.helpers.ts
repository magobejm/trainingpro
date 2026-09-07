import { Prisma } from '@prisma/client';
import {
  buildPlanDayGroupLookup,
  type ExerciseGroupFields,
  PLAN_EXERCISE_GROUP_INCLUDE,
} from '../../../../common/plan/plan-exercise-group.mapper';
import { buildPlanDayPlannedSetsLookup } from '../../../../common/plan/plan-day-planned-sets.mapper';
import { buildPlanDayLockedFieldsLookup } from '../../../../common/plan/read-locked-fields';
import type { PlannedSetSnapshot } from '../../../../common/notes/planned-set.mapper';
import { readPlannedSetsJson } from '../../../../common/notes/session-note-snapshot';
import type { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  CardioSessionItem,
  SessionInstance,
  SessionIntervalLog,
  SessionIsometricItem,
  SessionIsometricSetLog,
  SessionMobilityItem,
  SessionMobilitySetLog,
  SessionPlioItem,
  SessionPlioSetLog,
  SessionSportItem,
  SessionSportLog,
  SessionStartMode,
  SessionStrengthItem,
} from '../../domain/session.entity';

// eslint-disable-next-line max-lines-per-function
export function mapSession(
  row: Prisma.SessionInstanceGetPayload<{ include: ReturnType<typeof sessionInclude> }>,
  groupLookup: Map<number, ExerciseGroupFields> = new Map(),
  lockedFieldsLookup: Map<number, string[]> = new Map(),
  plannedSetsLookup: Map<number, PlannedSetSnapshot[]> = new Map(),
): SessionInstance {
  const readGroup = (sortOrder: number): ExerciseGroupFields =>
    groupLookup.get(sortOrder) ?? { groupId: null, groupType: null };
  const readLockedFields = (sortOrder: number): string[] => lockedFieldsLookup.get(sortOrder) ?? [];
  const readPlannedSets = (sortOrder: number, storedJson: Prisma.JsonValue | null): PlannedSetSnapshot[] =>
    plannedSetsLookup.get(sortOrder) ?? readPlannedSetsJson(storedJson);

  const strengthItems: SessionStrengthItem[] = row.items.map((item) => ({
    type: 'strength' as const,
    coachInstructions: item.coachInstructions,
    displayName: item.displayName,
    ...readGroup(item.sortOrder),
    id: item.id,
    lockedFields: readLockedFields(item.sortOrder),
    logs: item.logs.map((L) => ({
      effortRir: L.effortRir,
      effortRpe: L.effortRpe,
      repsDone: L.repsDone,
      sessionItemId: L.sessionItemId,
      setIndex: L.setIndex,
      weightDoneKg: L.weightDoneKg ? Number(L.weightDoneKg) : null,
    })),
    notes: item.notes,
    plannedSets: readPlannedSets(item.sortOrder, item.plannedSetsJson),
    repsMax: item.repsMax,
    repsMin: item.repsMin,
    restSeconds: item.restSeconds,
    setsPlanned: item.setsPlanned,
    sortOrder: item.sortOrder,
    sourceExerciseId: item.sourceExerciseId,
    targetRir: item.targetRir,
    targetRpe: item.targetRpe,
    weightRangeMaxKg: item.weightRangeMaxKg ? Number(item.weightRangeMaxKg) : null,
    weightRangeMinKg: item.weightRangeMinKg ? Number(item.weightRangeMinKg) : null,
  }));

  const plioItems: SessionPlioItem[] = row.plioBlocks.map((b) => ({
    type: 'plio' as const,
    coachInstructions: b.coachInstructions,
    displayName: b.displayName,
    ...readGroup(b.sortOrder),
    id: b.id,
    lockedFields: readLockedFields(b.sortOrder),
    logs: b.logs.map(
      (l): SessionPlioSetLog => ({
        effortRpe: l.effortRpe,
        repsDone: l.repsDone,
        sessionPlioBlockId: l.sessionPlioBlockId,
        setIndex: l.setIndex,
        weightDoneKg: l.weightDoneKg ? Number(l.weightDoneKg) : null,
      }),
    ),
    notes: b.notes,
    plannedSets: readPlannedSets(b.sortOrder, b.plannedSetsJson),
    restSeconds: b.restSeconds,
    roundsPlanned: b.roundsPlanned,
    sortOrder: b.sortOrder,
    targetRpe: b.targetRpe,
    workSeconds: b.workSeconds,
  }));

  const mobilityItems: SessionMobilityItem[] = row.mobilityBlocks.map((b) => ({
    type: 'mobility' as const,
    coachInstructions: b.coachInstructions,
    displayName: b.displayName,
    ...readGroup(b.sortOrder),
    id: b.id,
    lockedFields: readLockedFields(b.sortOrder),
    logs: b.logs.map(
      (l): SessionMobilitySetLog => ({
        effortRpe: l.effortRpe,
        repsDone: l.repsDone,
        romDone: l.romDone,
        sessionMobilityBlockId: l.sessionMobilityBlockId,
        setIndex: l.setIndex,
      }),
    ),
    notes: b.notes,
    plannedSets: readPlannedSets(b.sortOrder, b.plannedSetsJson),
    restSeconds: b.restSeconds,
    roundsPlanned: b.roundsPlanned,
    sortOrder: b.sortOrder,
    targetRpe: b.targetRpe,
    workSeconds: b.workSeconds,
  }));

  const isometricItems: SessionIsometricItem[] = row.isometricBlocks.map((b) => ({
    type: 'isometric' as const,
    coachInstructions: b.coachInstructions,
    displayName: b.displayName,
    ...readGroup(b.sortOrder),
    id: b.id,
    lockedFields: readLockedFields(b.sortOrder),
    logs: b.logs.map(
      (l): SessionIsometricSetLog => ({
        durationSecondsDone: l.durationSecondsDone,
        effortRpe: l.effortRpe,
        sessionIsometricBlockId: l.sessionIsometricBlockId,
        setIndex: l.setIndex,
        weightDoneKg: l.weightDoneKg ? Number(l.weightDoneKg) : null,
      }),
    ),
    notes: b.notes,
    plannedSets: readPlannedSets(b.sortOrder, b.plannedSetsJson),
    restSeconds: b.restSeconds ?? null,
    setsPlanned: b.setsPlanned,
    sortOrder: b.sortOrder,
    targetRpe: b.targetRpe,
  }));

  const sportItems: SessionSportItem[] = row.sportBlocks.map((b) => {
    const rawLog = b.logs[0];
    const log: SessionSportLog | null = rawLog
      ? {
          avgHeartRate: rawLog.avgHeartRate,
          durationMinutesDone: rawLog.durationMinutesDone,
          effortRpe: rawLog.effortRpe,
          sessionSportBlockId: rawLog.sessionSportBlockId,
        }
      : null;
    return {
      type: 'sport' as const,
      coachInstructions: b.coachInstructions,
      displayName: b.displayName,
      durationMinutes: b.durationMinutes,
      ...readGroup(b.sortOrder),
      id: b.id,
      lockedFields: readLockedFields(b.sortOrder),
      log,
      notes: b.notes,
      plannedSets: readPlannedSets(b.sortOrder, b.plannedSetsJson),
      sortOrder: b.sortOrder,
      targetRpe: b.targetRpe,
    };
  });

  const cardioItems: CardioSessionItem[] = row.cardioBlocks.map((b) => ({
    type: 'cardio' as const,
    coachInstructions: b.coachInstructions,
    displayName: b.displayName,
    ...readGroup(b.sortOrder),
    id: b.id,
    intervalLogs: b.intervalLogs.map(
      (l): SessionIntervalLog => ({
        avgHeartRate: l.avgHeartRate,
        distanceDoneMeters: l.distanceDoneMeters,
        durationSecondsDone: l.durationSecondsDone,
        effortRpe: l.effortRpe,
        intervalIndex: l.intervalIndex,
        sessionCardioBlockId: l.sessionCardioBlockId,
      }),
    ),
    lockedFields: readLockedFields(b.sortOrder),
    notes: b.notes,
    plannedSets: readPlannedSets(b.sortOrder, b.plannedSetsJson),
    restSeconds: b.restSeconds,
    roundsPlanned: b.roundsPlanned,
    sortOrder: b.sortOrder,
    targetDistanceMeters: b.targetDistanceMeters,
    targetRpe: b.targetRpe,
    workSeconds: b.workSeconds,
  }));

  const items = [...strengthItems, ...plioItems, ...mobilityItems, ...isometricItems, ...sportItems, ...cardioItems].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return {
    clientId: row.clientId,
    finishComment: row.finishComment,
    finishedAt: row.finishedAt,
    id: row.id,
    isCompleted: row.isCompleted,
    isIncomplete: row.isIncomplete,
    items,
    postFatigue: row.postFatigue,
    postMood: row.postMood,
    postPain: row.postPain,
    preFatigue: row.preFatigue,
    preMotivation: row.preMotivation,
    preRecovery: row.preRecovery,
    sessionDate: row.sessionDate,
    startMode: (row.startMode as SessionStartMode | null) ?? null,
    startedAt: row.startedAt,
    status: row.status,
    templateId: row.sourceTemplateId,
    templateVersion: row.sourceTemplateVersion,
  };
}

export function normalizeText(value: null | string | undefined): null | string {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function sessionInclude() {
  return {
    items: {
      orderBy: { sortOrder: 'asc' as const },
      where: { archivedAt: null },
      include: {
        logs: {
          orderBy: { setIndex: 'asc' as const },
        },
      },
    },
    plioBlocks: {
      orderBy: { sortOrder: 'asc' as const },
      where: { archivedAt: null },
      include: {
        logs: { orderBy: { setIndex: 'asc' as const } },
      },
    },
    mobilityBlocks: {
      orderBy: { sortOrder: 'asc' as const },
      where: { archivedAt: null },
      include: {
        logs: { orderBy: { setIndex: 'asc' as const } },
      },
    },
    isometricBlocks: {
      orderBy: { sortOrder: 'asc' as const },
      where: { archivedAt: null },
      include: {
        logs: { orderBy: { setIndex: 'asc' as const } },
      },
    },
    sportBlocks: {
      orderBy: { sortOrder: 'asc' as const },
      where: { archivedAt: null },
      include: {
        logs: true,
      },
    },
    cardioBlocks: {
      orderBy: { sortOrder: 'asc' as const },
      where: { archivedAt: null },
      include: {
        intervalLogs: {
          orderBy: { intervalIndex: 'asc' as const },
        },
      },
    },
  };
}

export function toDecimal(value: null | number | undefined) {
  return typeof value === 'number' ? new Prisma.Decimal(value) : null;
}

const PLAN_BLOCK_SETS_SELECT = {
  orderBy: { setIndex: 'asc' as const },
};

const PLAN_DAY_GROUP_BLOCKS_INCLUDE = {
  cardioBlocks: {
    select: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      lockedFieldsJson: true,
      notes: true,
      restSeconds: true,
      roundsPlanned: true,
      sets: PLAN_BLOCK_SETS_SELECT,
      sortOrder: true,
      targetRpe: true,
      workSeconds: true,
    },
    where: { archivedAt: null },
  },
  exercises: {
    select: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      lockedFieldsJson: true,
      notes: true,
      perSetWeightRangesJson: true,
      repsMax: true,
      repsMin: true,
      restSeconds: true,
      sets: PLAN_BLOCK_SETS_SELECT,
      setsPlanned: true,
      sortOrder: true,
      targetRir: true,
      targetRpe: true,
      weightRangeMaxKg: true,
      weightRangeMinKg: true,
    },
    where: { archivedAt: null },
  },
  isometricBlocks: {
    select: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      lockedFieldsJson: true,
      notes: true,
      restSeconds: true,
      sets: PLAN_BLOCK_SETS_SELECT,
      setsPlanned: true,
      sortOrder: true,
      targetRpe: true,
    },
    where: { archivedAt: null },
  },
  mobilityBlocks: {
    select: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      lockedFieldsJson: true,
      notes: true,
      restSeconds: true,
      roundsPlanned: true,
      sets: PLAN_BLOCK_SETS_SELECT,
      sortOrder: true,
      targetRpe: true,
      workSeconds: true,
    },
    where: { archivedAt: null },
  },
  plioBlocks: {
    select: {
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      lockedFieldsJson: true,
      notes: true,
      restSeconds: true,
      roundsPlanned: true,
      sets: PLAN_BLOCK_SETS_SELECT,
      sortOrder: true,
      targetRpe: true,
      workSeconds: true,
    },
    where: { archivedAt: null },
  },
  sportBlocks: {
    select: {
      durationMinutes: true,
      group: PLAN_EXERCISE_GROUP_INCLUDE,
      lockedFieldsJson: true,
      notes: true,
      sets: PLAN_BLOCK_SETS_SELECT,
      sortOrder: true,
      targetRpe: true,
    },
    where: { archivedAt: null },
  },
} as const;

export async function loadPlanDayGroupLookup(
  prisma: PrismaService,
  planDayId: null | string | undefined,
): Promise<Map<number, ExerciseGroupFields>> {
  const lookups = await loadPlanDayLookups(prisma, planDayId);
  return lookups.groupLookup;
}

async function loadPlanDayLookups(
  prisma: PrismaService,
  planDayId: null | string | undefined,
): Promise<{
  groupLookup: Map<number, ExerciseGroupFields>;
  lockedFieldsLookup: Map<number, string[]>;
  plannedSetsLookup: Map<number, PlannedSetSnapshot[]>;
}> {
  if (!planDayId) {
    return { groupLookup: new Map(), lockedFieldsLookup: new Map(), plannedSetsLookup: new Map() };
  }
  const day = await prisma.planDay.findFirst({
    include: PLAN_DAY_GROUP_BLOCKS_INCLUDE,
    where: { archivedAt: null, id: planDayId },
  });
  if (!day) {
    return { groupLookup: new Map(), lockedFieldsLookup: new Map(), plannedSetsLookup: new Map() };
  }
  return {
    groupLookup: buildPlanDayGroupLookup(day),
    lockedFieldsLookup: buildPlanDayLockedFieldsLookup(day),
    plannedSetsLookup: buildPlanDayPlannedSetsLookup(day),
  };
}

export async function mapSessionWithGroups(
  prisma: PrismaService,
  row: Prisma.SessionInstanceGetPayload<{ include: ReturnType<typeof sessionInclude> }>,
): Promise<SessionInstance> {
  const { groupLookup, lockedFieldsLookup, plannedSetsLookup } = await loadPlanDayLookups(prisma, row.planDayId);
  return mapSession(row, groupLookup, lockedFieldsLookup, plannedSetsLookup);
}
