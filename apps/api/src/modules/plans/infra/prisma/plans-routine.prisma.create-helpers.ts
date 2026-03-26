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
import {
  connectOptional,
  normalizeLockedFields,
  normalizePerSetRanges,
  normalizeText,
  toDecimal,
} from './plans-routine.prisma.helpers';

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
    lockedFieldsJson: normalizeLockedFields(e.lockedFields),
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
    lockedFieldsJson: normalizeLockedFields(b.lockedFields),
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
    lockedFieldsJson: normalizeLockedFields(b.lockedFields),
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
    lockedFieldsJson: normalizeLockedFields(b.lockedFields),
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
    lockedFieldsJson: normalizeLockedFields(b.lockedFields),
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
    lockedFieldsJson: normalizeLockedFields(b.lockedFields),
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
