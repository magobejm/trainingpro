/* eslint-disable @typescript-eslint/no-explicit-any, max-len */
import { FieldMode, Prisma } from '@prisma/client';
import type {
  RoutineCardioInput,
  RoutineCardioSetInput,
  RoutineDayInput,
  RoutineIsometricInput,
  RoutineIsometricSetInput,
  RoutinePlioInput,
  RoutinePlioSetInput,
  RoutineSportInput,
  RoutineSportSetInput,
  RoutineStrengthInput,
  RoutineStrengthSetInput,
  RoutineWarmupInput,
  RoutineWarmupSetInput,
} from '../../domain/routine-template.input';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function routineTemplateInclude(): any {
  const where = { archivedAt: null };
  const orderBy = { sortOrder: 'asc' as const };
  return {
    assignedClients: {
      select: { id: true },
      where: { archivedAt: null },
    },
    days: {
      include: {
        cardioBlocks: {
          include: { fieldModes: true, sets: { orderBy: { setIndex: 'asc' as const } } },
          orderBy,
          where,
        },
        exercises: {
          include: { fieldModes: true, sets: { orderBy: { setIndex: 'asc' as const } } },
          orderBy,
          where,
        },
        exerciseGroups: {
          orderBy: { sortOrder: 'asc' as const },
        },
        isometricBlocks: {
          include: { fieldModes: true, sets: { orderBy: { setIndex: 'asc' as const } } },
          orderBy,
          where,
        },
        plioBlocks: {
          include: { fieldModes: true, sets: { orderBy: { setIndex: 'asc' as const } } },
          orderBy,
          where,
        },
        sportBlocks: {
          include: { fieldModes: true, sets: { orderBy: { setIndex: 'asc' as const } } },
          orderBy,
          where,
        },
        warmupBlocks: {
          include: { fieldModes: true, sets: { orderBy: { setIndex: 'asc' as const } } },
          orderBy,
          where,
        },
      },
      orderBy: { dayIndex: 'asc' as const },
      where,
    },
    neats: { orderBy },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RoutineRow = any;

export type RoutineTemplateMetadata = {
  expectedCompletionDays: null | number;
  objectiveIds: string[];
  objectives: Array<{
    code: string;
    id: string;
    isDefault: boolean;
    label: string;
    sortOrder: number;
  }>;
};

export function mapRoutineTemplate(row: RoutineRow, metadata?: RoutineTemplateMetadata) {
  const r = row as any;
  const safeMetadata = metadata ?? emptyRoutineMetadata();
  return {
    assignedClientsCount: row.assignedClients.length,
    coachMembershipId: row.coachMembershipId,
    createdAt: row.createdAt,
    days: row.days.map(mapRoutineDay),
    expectedCompletionDays: safeMetadata.expectedCompletionDays,
    id: row.id,
    isAssigned: row.assignedClients.length > 0,
    name: row.name,
    neats: ((r.neats ?? []) as any[]).map((n: any) => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      id: n.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      title: n.title,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      description: n.description ?? '',
    })),
    objectiveIds: safeMetadata.objectiveIds,
    objectives: safeMetadata.objectives,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    scope: r.scope ?? 'COACH',
    templateVersion: row.templateVersion,
    updatedAt: row.updatedAt,
  };
}

export function emptyRoutineMetadata(): RoutineTemplateMetadata {
  return { expectedCompletionDays: null, objectiveIds: [], objectives: [] };
}

function mapRoutineDay(day: any) {
  return {
    cardioBlocks: (day.cardioBlocks ?? []).map(mapCardioOutput),
    dayIndex: day.dayIndex,
    exercises: (day.exercises ?? []).map(mapStrengthOutput),
    groups: (day.exerciseGroups ?? []).map(mapGroupOutput),
    id: day.id,
    isometricBlocks: (day.isometricBlocks ?? []).map(mapIsometricOutput),
    plioBlocks: (day.plioBlocks ?? []).map(mapPlioOutput),
    sportBlocks: (day.sportBlocks ?? []).map(mapSportOutput),
    title: day.title,
    warmupBlocks: (day.warmupBlocks ?? []).map(mapWarmupOutput),
  };
}

function mapGroupOutput(g: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    groupType: g.groupType,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    id: g.id,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    note: g.note ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    sortOrder: g.sortOrder,
  };
}

function mapStrengthOutput(e: any) {
  return {
    displayName: e.displayName,
    exerciseLibraryId: e.exerciseLibraryId,
    fieldModes: e.fieldModes.map((m: any) => ({ fieldKey: m.fieldKey, mode: m.mode })),
    groupId: e.groupId ?? null,
    id: e.id,
    notes: e.notes,
    perSetWeightRangesJson: e.perSetWeightRangesJson,
    repsMax: e.repsMax,
    repsMin: e.repsMin,
    restSeconds: e.restSeconds,
    sets: e.sets.map(mapStrengthSetOutput),
    setsPlanned: e.setsPlanned,
    sortOrder: e.sortOrder,
    targetRir: e.targetRir,
    targetRpe: e.targetRpe,
    weightRangeMaxKg: e.weightRangeMaxKg ? Number(e.weightRangeMaxKg) : null,
    weightRangeMinKg: e.weightRangeMinKg ? Number(e.weightRangeMinKg) : null,
  };
}

function mapStrengthSetOutput(s: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    advancedTechnique: s.advancedTechnique ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    note: s.note ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    reps: s.reps ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    restSeconds: s.restSeconds ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rir: s.rir ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rpe: s.rpe ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    setIndex: s.setIndex,
    weightKg: s.weightKg ? Number(s.weightKg) : null,
  };
}

function mapCardioOutput(b: any) {
  return {
    cardioMethodLibraryId: b.cardioMethodLibraryId,
    displayName: b.displayName,
    fieldModes: b.fieldModes.map((m: any) => ({ fieldKey: m.fieldKey, mode: m.mode })),
    groupId: b.groupId ?? null,
    id: b.id,
    notes: b.notes,
    restSeconds: b.restSeconds,
    roundsPlanned: b.roundsPlanned,
    sets: b.sets.map(mapCardioSetOutput),
    sortOrder: b.sortOrder,
    targetDistanceMeters: b.targetDistanceMeters,
    targetRpe: b.targetRpe,
    workSeconds: b.workSeconds,
  };
}

function mapCardioSetOutput(s: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    fcMaxPct: s.fcMaxPct ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    fcReservePct: s.fcReservePct ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    heartRate: s.heartRate ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    note: s.note ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rpe: s.rpe ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    setIndex: s.setIndex,
  };
}

function mapPlioOutput(b: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    displayName: b.displayName,
    fieldModes: ((b.fieldModes ?? []) as any[]).map((m: any) => ({ fieldKey: m.fieldKey, mode: m.mode })),
    groupId: b.groupId ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    id: b.id,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    notes: b.notes,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    plioExerciseLibraryId: b.plioExerciseLibraryId,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    restSeconds: b.restSeconds,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    roundsPlanned: b.roundsPlanned,
    sets: ((b.sets ?? []) as any[]).map(mapPlioSetOutput),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    sortOrder: b.sortOrder,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    targetRpe: b.targetRpe,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    workSeconds: b.workSeconds,
  };
}

function mapPlioSetOutput(s: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    note: s.note ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    reps: s.reps ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    restSeconds: s.restSeconds ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rpe: s.rpe ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    setIndex: s.setIndex,
    weightKg: s.weightKg ? Number(s.weightKg) : null,
  };
}

function mapWarmupOutput(b: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    displayName: b.displayName,
    fieldModes: ((b.fieldModes ?? []) as any[]).map((m: any) => ({ fieldKey: m.fieldKey, mode: m.mode })),
    groupId: b.groupId ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    id: b.id,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    notes: b.notes,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    restSeconds: b.restSeconds,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    roundsPlanned: b.roundsPlanned,
    sets: ((b.sets ?? []) as any[]).map(mapWarmupSetOutput),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    sortOrder: b.sortOrder,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    targetRpe: b.targetRpe,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    warmupExerciseLibraryId: b.warmupExerciseLibraryId,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    workSeconds: b.workSeconds,
  };
}

function mapWarmupSetOutput(s: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    note: s.note ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    reps: s.reps ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    restSeconds: s.restSeconds ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rom: s.rom ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rpe: s.rpe ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    setIndex: s.setIndex,
  };
}

function mapSportOutput(b: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    displayName: b.displayName,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    durationMinutes: b.durationMinutes,
    fieldModes: ((b.fieldModes ?? []) as any[]).map((m: any) => ({ fieldKey: m.fieldKey, mode: m.mode })),
    groupId: b.groupId ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    id: b.id,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    notes: b.notes,
    sets: ((b.sets ?? []) as any[]).map(mapSportSetOutput),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    sortOrder: b.sortOrder,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    sportLibraryId: b.sportLibraryId,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    targetRpe: b.targetRpe,
  };
}

function mapSportSetOutput(s: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    fcMaxPct: s.fcMaxPct ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    fcReservePct: s.fcReservePct ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    heartRate: s.heartRate ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    note: s.note ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    reps: s.reps ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    restSeconds: s.restSeconds ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rir: s.rir ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rpe: s.rpe ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    setIndex: s.setIndex,
    weightKg: s.weightKg ? Number(s.weightKg) : null,
  };
}

function mapIsometricOutput(b: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    displayName: b.displayName,
    fieldModes: ((b.fieldModes ?? []) as any[]).map((m: any) => ({ fieldKey: m.fieldKey, mode: m.mode })),
    groupId: b.groupId ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    id: b.id,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    isometricExerciseLibraryId: b.isometricExerciseLibraryId,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    notes: b.notes,
    sets: ((b.sets ?? []) as any[]).map(mapIsometricSetOutput),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    setsPlanned: b.setsPlanned ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    sortOrder: b.sortOrder,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    targetRpe: b.targetRpe,
  };
}

function mapIsometricSetOutput(s: any) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    durationSeconds: s.durationSeconds ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    note: s.note ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    restSeconds: s.restSeconds ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    rpe: s.rpe ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    setIndex: s.setIndex,
    weightKg: s.weightKg ? Number(s.weightKg) : null,
  };
}

/* ── Create helpers ── */

/**
 * Creates day with all block types nested. Groups are NOT included here since they require
 * a two-pass creation (groups first → get real UUIDs → update block groupId FKs).
 * Call createDayGroups separately after the day is created.
 */
export function mapRoutineDayCreate(day: RoutineDayInput): Prisma.PlanDayCreateWithoutTemplateInput {
  return {
    dayIndex: day.dayIndex,
    title: day.title.trim(),
    exercises: { create: (day.exercises ?? []).map((e) => mapStrengthCreate(e, null)) },
    cardioBlocks: { create: (day.cardioBlocks ?? []).map((b) => mapCardioCreate(b, null)) },
    plioBlocks: { create: (day.plioBlocks ?? []).map((b) => mapPlioCreate(b, null)) },
    warmupBlocks: { create: (day.warmupBlocks ?? []).map((b) => mapWarmupCreate(b, null)) },
    sportBlocks: { create: (day.sportBlocks ?? []).map((b) => mapSportCreate(b, null)) },
    isometricBlocks: { create: (day.isometricBlocks ?? []).map((b) => mapIsometricCreate(b, null)) },
  } as any;
}

export function mapStrengthCreate(
  e: RoutineStrengthInput,
  groupId: null | string,
): Prisma.PlanStrengthExerciseCreateWithoutDayInput {
  return {
    displayName: e.displayName.trim(),
    fieldModes: {
      create: e.fieldModes.map((m: { fieldKey: string; mode: string }) => ({
        fieldKey: m.fieldKey.trim(),
        mode: m.mode as FieldMode,
      })),
    },
    group: connectOptional(groupId),
    libraryExercise: connectOptional(e.exerciseLibraryId),
    notes: normalizeText(e.notes),
    perSetWeightRangesJson: normalizePerSetRanges(e.perSetWeightRanges),
    repsMax: e.repsMax ?? null,
    repsMin: e.repsMin ?? null,
    restSeconds: e.restSeconds ?? 0,
    sets: { create: (e.sets ?? []).map(mapStrengthSetCreate) },
    setsPlanned: e.setsPlanned ?? null,
    sortOrder: e.sortOrder,
    targetRir: e.targetRir ?? null,
    targetRpe: e.targetRpe ?? null,
    weightRangeMaxKg: toDecimal(e.weightRangeMaxKg),
    weightRangeMinKg: toDecimal(e.weightRangeMinKg),
  } as any;
}

function mapStrengthSetCreate(s: RoutineStrengthSetInput) {
  return {
    setIndex: s.setIndex,
    reps: s.reps ?? null,
    rpe: s.rpe ?? null,
    weightKg: toDecimal(s.weightKg),
    rir: s.rir ?? null,
    restSeconds: s.restSeconds ?? null,
    advancedTechnique: s.advancedTechnique ?? null,
    note: s.note ?? null,
  };
}

export function mapCardioCreate(b: RoutineCardioInput, groupId: null | string): Prisma.PlanCardioBlockCreateWithoutDayInput {
  return {
    displayName: b.displayName.trim(),
    fieldModes: {
      create: b.fieldModes.map((m: { fieldKey: string; mode: string }) => ({
        fieldKey: m.fieldKey.trim(),
        mode: m.mode as FieldMode,
      })),
    },
    group: connectOptional(groupId),
    libraryCardioMethod: connectOptional(b.cardioMethodLibraryId),
    notes: normalizeText(b.notes),
    restSeconds: b.restSeconds,
    roundsPlanned: b.roundsPlanned,
    sets: { create: (b.sets ?? []).map(mapCardioSetCreate) },
    sortOrder: b.sortOrder,
    targetDistanceMeters: b.targetDistanceMeters ?? null,
    targetRpe: b.targetRpe ?? null,
    workSeconds: b.workSeconds,
  } as any;
}

function mapCardioSetCreate(s: RoutineCardioSetInput) {
  return {
    setIndex: s.setIndex,
    fcMaxPct: s.fcMaxPct ?? null,
    fcReservePct: s.fcReservePct ?? null,
    heartRate: s.heartRate ?? null,
    rpe: s.rpe ?? null,
    note: s.note ?? null,
  };
}

export function mapPlioCreate(b: RoutinePlioInput, groupId: null | string): any {
  return {
    displayName: b.displayName.trim(),
    fieldModes: { create: (b.fieldModes ?? []).map((m) => ({ fieldKey: m.fieldKey.trim(), mode: m.mode as FieldMode })) },
    group: connectOptional(groupId),
    libraryPlioExercise: connectOptional(b.plioExerciseLibraryId),
    notes: normalizeText(b.notes),
    restSeconds: b.restSeconds,
    roundsPlanned: b.roundsPlanned,
    sets: { create: (b.sets ?? []).map(mapPlioSetCreate) },
    sortOrder: b.sortOrder,
    targetRpe: b.targetRpe ?? null,
    workSeconds: b.workSeconds,
  };
}

function mapPlioSetCreate(s: RoutinePlioSetInput) {
  return {
    setIndex: s.setIndex,
    reps: s.reps ?? null,
    rpe: s.rpe ?? null,
    weightKg: toDecimal(s.weightKg),
    restSeconds: s.restSeconds ?? null,
    note: s.note ?? null,
  };
}

export function mapWarmupCreate(b: RoutineWarmupInput, groupId: null | string): any {
  return {
    displayName: b.displayName.trim(),
    fieldModes: { create: (b.fieldModes ?? []).map((m) => ({ fieldKey: m.fieldKey.trim(), mode: m.mode as FieldMode })) },
    group: connectOptional(groupId),
    libraryWarmupExercise: connectOptional(b.warmupExerciseLibraryId),
    notes: normalizeText(b.notes),
    restSeconds: b.restSeconds,
    roundsPlanned: b.roundsPlanned,
    sets: { create: (b.sets ?? []).map(mapWarmupSetCreate) },
    sortOrder: b.sortOrder,
    targetRpe: b.targetRpe ?? null,
    workSeconds: b.workSeconds,
  };
}

function mapWarmupSetCreate(s: RoutineWarmupSetInput) {
  return {
    setIndex: s.setIndex,
    reps: s.reps ?? null,
    rpe: s.rpe ?? null,
    rom: s.rom ?? null,
    restSeconds: s.restSeconds ?? null,
    note: s.note ?? null,
  };
}

export function mapSportCreate(b: RoutineSportInput, groupId: null | string): any {
  return {
    displayName: b.displayName.trim(),
    durationMinutes: b.durationMinutes,
    fieldModes: { create: (b.fieldModes ?? []).map((m) => ({ fieldKey: m.fieldKey.trim(), mode: m.mode as FieldMode })) },
    group: connectOptional(groupId),
    librarySport: connectOptional(b.sportLibraryId),
    notes: normalizeText(b.notes),
    sets: { create: (b.sets ?? []).map(mapSportSetCreate) },
    sortOrder: b.sortOrder,
    targetRpe: b.targetRpe ?? null,
  };
}

function mapSportSetCreate(s: RoutineSportSetInput) {
  return {
    setIndex: s.setIndex,
    reps: s.reps ?? null,
    rpe: s.rpe ?? null,
    rir: s.rir ?? null,
    weightKg: toDecimal(s.weightKg),
    fcMaxPct: s.fcMaxPct ?? null,
    fcReservePct: s.fcReservePct ?? null,
    heartRate: s.heartRate ?? null,
    restSeconds: s.restSeconds ?? null,
    note: s.note ?? null,
  };
}

export function mapIsometricCreate(b: RoutineIsometricInput, groupId: null | string): any {
  return {
    displayName: b.displayName.trim(),
    fieldModes: { create: (b.fieldModes ?? []).map((m) => ({ fieldKey: m.fieldKey.trim(), mode: m.mode as FieldMode })) },
    group: connectOptional(groupId),
    libraryIsometricExercise: connectOptional(b.isometricExerciseLibraryId),
    notes: normalizeText(b.notes),
    sets: { create: (b.sets ?? []).map(mapIsometricSetCreate) },
    setsPlanned: b.setsPlanned ?? null,
    sortOrder: b.sortOrder,
    targetRpe: b.targetRpe ?? null,
  };
}

function mapIsometricSetCreate(s: RoutineIsometricSetInput) {
  return {
    setIndex: s.setIndex,
    rpe: s.rpe ?? null,
    durationSeconds: s.durationSeconds ?? null,
    weightKg: toDecimal(s.weightKg),
    restSeconds: s.restSeconds ?? null,
    note: s.note ?? null,
  };
}

/* ── Utilities ── */

function connectOptional(id: null | string | undefined) {
  return id ? { connect: { id } } : undefined;
}

function normalizeText(v: null | string | undefined): null | string {
  const t = v?.trim();
  return t || null;
}

function normalizePerSetRanges(
  ranges?: { maxKg?: null | number; minKg?: null | number }[],
): Prisma.InputJsonValue | undefined {
  if (!ranges || ranges.length === 0) return undefined;
  return ranges.map((r) => ({
    maxKg: r.maxKg ?? null,
    minKg: r.minKg ?? null,
  })) as Prisma.InputJsonValue;
}

function toDecimal(v: null | number | undefined) {
  return typeof v === 'number' ? new Prisma.Decimal(v) : null;
}
