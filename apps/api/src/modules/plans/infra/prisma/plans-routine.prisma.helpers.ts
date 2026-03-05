/* eslint-disable @typescript-eslint/no-explicit-any, max-len */
import { FieldMode, Prisma } from '@prisma/client';
import type {
  RoutineCardioInput,
  RoutineDayInput,
  RoutinePlioInput,
  RoutineSportInput,
  RoutineStrengthInput,
  RoutineWarmupInput,
} from '../../domain/routine-template.input';

export function routineTemplateInclude() {
  const where = { archivedAt: null };
  const orderBy = { sortOrder: 'asc' as const };
  return {
    assignedClients: {
      select: { id: true },
      where: { archivedAt: null },
    },
    days: {
      include: {
        cardioBlocks: { include: { fieldModes: true }, orderBy, where },
        exercises: { include: { fieldModes: true }, orderBy, where },
        plioBlocks: { orderBy, where },
        sportBlocks: { orderBy, where },
        warmupBlocks: { orderBy, where },
      },
      orderBy: { dayIndex: 'asc' as const },
      where,
    },
  };
}

export type RoutineRow = Prisma.PlanTemplateGetPayload<{
  include: ReturnType<typeof routineTemplateInclude>;
}>;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    id: day.id,
    plioBlocks: (day.plioBlocks ?? []).map(mapPlioOutput),
    sportBlocks: (day.sportBlocks ?? []).map(mapSportOutput),
    title: day.title,
    warmupBlocks: (day.warmupBlocks ?? []).map(mapWarmupOutput),
  };
}

function mapStrengthOutput(
  e: Prisma.PlanStrengthExerciseGetPayload<{ include: { fieldModes: true } }>,
) {
  return {
    displayName: e.displayName,
    exerciseLibraryId: e.exerciseLibraryId,
    fieldModes: e.fieldModes.map((m) => ({ fieldKey: m.fieldKey, mode: m.mode })),
    id: e.id,
    notes: e.notes,
    perSetWeightRangesJson: e.perSetWeightRangesJson,
    repsMax: e.repsMax,
    repsMin: e.repsMin,
    restSeconds: e.restSeconds,
    setsPlanned: e.setsPlanned,
    sortOrder: e.sortOrder,
    targetRir: e.targetRir,
    targetRpe: e.targetRpe,
    weightRangeMaxKg: e.weightRangeMaxKg ? Number(e.weightRangeMaxKg) : null,
    weightRangeMinKg: e.weightRangeMinKg ? Number(e.weightRangeMinKg) : null,
  };
}

function mapCardioOutput(b: Prisma.PlanCardioBlockGetPayload<{ include: { fieldModes: true } }>) {
  return {
    cardioMethodLibraryId: b.cardioMethodLibraryId,
    displayName: b.displayName,
    fieldModes: b.fieldModes.map((m) => ({ fieldKey: m.fieldKey, mode: m.mode })),
    id: b.id,
    notes: b.notes,
    restSeconds: b.restSeconds,
    roundsPlanned: b.roundsPlanned,
    sortOrder: b.sortOrder,
    targetDistanceMeters: b.targetDistanceMeters,
    targetRpe: b.targetRpe,
    workSeconds: b.workSeconds,
  };
}

function mapPlioOutput(b: any) {
  return {
    displayName: b.displayName,
    id: b.id,
    notes: b.notes,
    plioExerciseLibraryId: b.plioExerciseLibraryId,
    restSeconds: b.restSeconds,
    roundsPlanned: b.roundsPlanned,
    sortOrder: b.sortOrder,
    targetRpe: b.targetRpe,
    workSeconds: b.workSeconds,
  };
}

function mapWarmupOutput(b: any) {
  return {
    displayName: b.displayName,
    id: b.id,
    notes: b.notes,
    restSeconds: b.restSeconds,
    roundsPlanned: b.roundsPlanned,
    sortOrder: b.sortOrder,
    targetRpe: b.targetRpe,
    warmupExerciseLibraryId: b.warmupExerciseLibraryId,
    workSeconds: b.workSeconds,
  };
}

function mapSportOutput(b: any) {
  return {
    displayName: b.displayName,
    durationMinutes: b.durationMinutes,
    id: b.id,
    notes: b.notes,
    sortOrder: b.sortOrder,
    sportLibraryId: b.sportLibraryId,
    targetRpe: b.targetRpe,
  };
}

/* ── Create helpers ── */

export function mapRoutineDayCreate(
  day: RoutineDayInput,
): Prisma.PlanDayCreateWithoutTemplateInput {
  return {
    dayIndex: day.dayIndex,
    title: day.title.trim(),
    exercises: { create: (day.exercises ?? []).map(mapStrengthCreate) },
    cardioBlocks: { create: (day.cardioBlocks ?? []).map(mapCardioCreate) },
    plioBlocks: { create: (day.plioBlocks ?? []).map(mapPlioCreate) },
    warmupBlocks: { create: (day.warmupBlocks ?? []).map(mapWarmupCreate) },
    sportBlocks: { create: (day.sportBlocks ?? []).map(mapSportCreate) },
  } as any;
}

function mapStrengthCreate(
  e: RoutineStrengthInput,
): Prisma.PlanStrengthExerciseCreateWithoutDayInput {
  return {
    displayName: e.displayName.trim(),
    fieldModes: {
      create: e.fieldModes.map((m) => ({
        fieldKey: m.fieldKey.trim(),
        mode: m.mode as FieldMode,
      })),
    },
    libraryExercise: connectOptional(e.exerciseLibraryId),
    notes: normalizeText(e.notes),
    perSetWeightRangesJson: normalizePerSetRanges(e.perSetWeightRanges),
    repsMax: e.repsMax ?? null,
    repsMin: e.repsMin ?? null,
    restSeconds: e.restSeconds ?? 0,
    setsPlanned: e.setsPlanned ?? null,
    sortOrder: e.sortOrder,
    targetRir: e.targetRir ?? null,
    targetRpe: e.targetRpe ?? null,
    weightRangeMaxKg: toDecimal(e.weightRangeMaxKg),
    weightRangeMinKg: toDecimal(e.weightRangeMinKg),
  };
}

function mapCardioCreate(b: RoutineCardioInput): Prisma.PlanCardioBlockCreateWithoutDayInput {
  return {
    displayName: b.displayName.trim(),
    fieldModes: {
      create: b.fieldModes.map((m) => ({
        fieldKey: m.fieldKey.trim(),
        mode: m.mode as FieldMode,
      })),
    },
    libraryCardioMethod: connectOptional(b.cardioMethodLibraryId),
    notes: normalizeText(b.notes),
    restSeconds: b.restSeconds,
    roundsPlanned: b.roundsPlanned,
    sortOrder: b.sortOrder,
    targetDistanceMeters: b.targetDistanceMeters ?? null,
    targetRpe: b.targetRpe ?? null,
    workSeconds: b.workSeconds,
  };
}

function mapPlioCreate(b: RoutinePlioInput): any {
  return {
    displayName: b.displayName.trim(),
    libraryPlioExercise: connectOptional(b.plioExerciseLibraryId),
    notes: normalizeText(b.notes),
    restSeconds: b.restSeconds,
    roundsPlanned: b.roundsPlanned,
    sortOrder: b.sortOrder,
    targetRpe: b.targetRpe ?? null,
    workSeconds: b.workSeconds,
  };
}

function mapWarmupCreate(b: RoutineWarmupInput): any {
  return {
    displayName: b.displayName.trim(),
    libraryWarmupExercise: connectOptional(b.warmupExerciseLibraryId),
    notes: normalizeText(b.notes),
    restSeconds: b.restSeconds,
    roundsPlanned: b.roundsPlanned,
    sortOrder: b.sortOrder,
    targetRpe: b.targetRpe ?? null,
    workSeconds: b.workSeconds,
  };
}

function mapSportCreate(b: RoutineSportInput): any {
  return {
    displayName: b.displayName.trim(),
    durationMinutes: b.durationMinutes,
    librarySport: connectOptional(b.sportLibraryId),
    notes: normalizeText(b.notes),
    sortOrder: b.sortOrder,
    targetRpe: b.targetRpe ?? null,
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
