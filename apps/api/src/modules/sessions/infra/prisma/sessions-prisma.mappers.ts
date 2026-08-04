import { BadRequestException } from '@nestjs/common';
import { Prisma, SessionStatus } from '@prisma/client';
import { buildSessionNoteSnapshot, plannedSetsJsonToInput } from '../../../../common/notes/session-note-snapshot';
import type {
  SessionIsometricSetLog,
  SessionMobilitySetLog,
  SessionPlioSetLog,
  SessionSetLog,
  SessionSportLog,
} from '../../domain/session.entity';

export type TemplateExerciseSnapshot = {
  coachInstructions: null | string;
  displayName: string;
  exerciseLibraryId: null | string;
  notes: null | string;
  perSetWeightRangesJson: Prisma.JsonValue | null;
  plannedSetsJson: Prisma.JsonValue | null;
  repsMax: null | number;
  repsMin: null | number;
  restSeconds: null | number;
  setsPlanned: null | number;
  sortOrder: number;
  targetRir: null | number;
  targetRpe: null | number;
  weightRangeMaxKg: Prisma.Decimal | null;
  weightRangeMinKg: Prisma.Decimal | null;
};

export type TemplatePlioSnapshot = {
  coachInstructions: null | string;
  displayName: string;
  notes: null | string;
  plannedSetsJson: Prisma.JsonValue | null;
  plioExerciseLibraryId: null | string;
  roundsPlanned: number;
  sortOrder: number;
  workSeconds: number;
  restSeconds: number;
  targetRpe: null | number;
};

export type TemplateMobilitySnapshot = {
  coachInstructions: null | string;
  displayName: string;
  mobilityExerciseLibraryId: null | string;
  notes: null | string;
  plannedSetsJson: Prisma.JsonValue | null;
  roundsPlanned: number;
  sortOrder: number;
  workSeconds: number;
  restSeconds: number;
  targetRpe: null | number;
};

export type TemplateIsometricSnapshot = {
  coachInstructions: null | string;
  displayName: string;
  isometricExerciseLibraryId: null | string;
  notes: null | string;
  plannedSetsJson: Prisma.JsonValue | null;
  restSeconds: number;
  setsPlanned: null | number;
  sortOrder: number;
  targetRpe: null | number;
};

export type TemplateSportSnapshot = {
  coachInstructions: null | string;
  displayName: string;
  notes: null | string;
  plannedSetsJson: Prisma.JsonValue | null;
  sportLibraryId: null | string;
  durationMinutes: number;
  sortOrder: number;
  targetRpe: null | number;
};

export function assertSessionMutable(status: SessionStatus): void {
  if (status === SessionStatus.COMPLETED) {
    throw new BadRequestException('Session already completed');
  }
}

export function mapSessionItemCreate(item: TemplateExerciseSnapshot): Prisma.SessionStrengthItemCreateWithoutSessionInput {
  return {
    coachInstructions: item.coachInstructions,
    displayName: item.displayName,
    notes: item.notes,
    perSetRangesJson: toInputJson(item.perSetWeightRangesJson),
    plannedSetsJson: toInputJson(item.plannedSetsJson),
    repsMax: item.repsMax,
    repsMin: item.repsMin,
    restSeconds: item.restSeconds,
    setsPlanned: item.setsPlanned,
    sortOrder: item.sortOrder,
    sourceExerciseId: item.exerciseLibraryId,
    targetRir: item.targetRir,
    targetRpe: item.targetRpe,
    weightRangeMaxKg: item.weightRangeMaxKg,
    weightRangeMinKg: item.weightRangeMinKg,
  };
}

export function pickPlanDay<T extends { id: string }>(days: T[], planDayId?: string | null): T | undefined {
  if (days.length === 0) return undefined;
  if (planDayId) {
    return days.find((d) => d.id === planDayId) ?? days[0];
  }
  return days[0];
}

export function readDayExercises(
  days: Array<{ id: string; exercises: TemplateExerciseSnapshot[] }>,
  planDayId?: string | null,
): null | TemplateExerciseSnapshot[] {
  const day = pickPlanDay(days, planDayId);
  if (!day || day.exercises.length === 0) {
    return null;
  }
  return day.exercises;
}

/** @deprecated use readDayExercises */
export function readFirstDayExercises(days: { exercises: TemplateExerciseSnapshot[] }[]): null | TemplateExerciseSnapshot[] {
  return readDayExercises(days as Array<{ id: string; exercises: TemplateExerciseSnapshot[] }>, null);
}

export function readDayPlioBlocks(
  days: Array<{ id: string; plioBlocks?: TemplatePlioSnapshot[] }>,
  planDayId?: string | null,
): TemplatePlioSnapshot[] {
  return pickPlanDay(days, planDayId)?.plioBlocks ?? [];
}

export function readDayMobilityBlocks(
  days: Array<{ id: string; mobilityBlocks?: TemplateMobilitySnapshot[] }>,
  planDayId?: string | null,
): TemplateMobilitySnapshot[] {
  return pickPlanDay(days, planDayId)?.mobilityBlocks ?? [];
}

export function readDayIsometricBlocks(
  days: Array<{ id: string; isometricBlocks?: TemplateIsometricSnapshot[] }>,
  planDayId?: string | null,
): TemplateIsometricSnapshot[] {
  return pickPlanDay(days, planDayId)?.isometricBlocks ?? [];
}

export function readDaySportBlocks(
  days: Array<{ id: string; sportBlocks?: TemplateSportSnapshot[] }>,
  planDayId?: string | null,
): TemplateSportSnapshot[] {
  return pickPlanDay(days, planDayId)?.sportBlocks ?? [];
}

export function readFirstDayPlioBlocks(days: { plioBlocks?: TemplatePlioSnapshot[] }[]): TemplatePlioSnapshot[] {
  return readDayPlioBlocks(days as Array<{ id: string; plioBlocks?: TemplatePlioSnapshot[] }>, null);
}

export function readFirstDayMobilityBlocks(
  days: { mobilityBlocks?: TemplateMobilitySnapshot[] }[],
): TemplateMobilitySnapshot[] {
  return readDayMobilityBlocks(days as Array<{ id: string; mobilityBlocks?: TemplateMobilitySnapshot[] }>, null);
}

export function readFirstDayIsometricBlocks(
  days: { isometricBlocks?: TemplateIsometricSnapshot[] }[],
): TemplateIsometricSnapshot[] {
  return readDayIsometricBlocks(days as Array<{ id: string; isometricBlocks?: TemplateIsometricSnapshot[] }>, null);
}

export function readFirstDaySportBlocks(days: { sportBlocks?: TemplateSportSnapshot[] }[]): TemplateSportSnapshot[] {
  return readDaySportBlocks(days as Array<{ id: string; sportBlocks?: TemplateSportSnapshot[] }>, null);
}

export function mapSessionPlioCreate(block: TemplatePlioSnapshot): Prisma.SessionPlioBlockCreateWithoutSessionInput {
  return {
    coachInstructions: block.coachInstructions,
    displayName: block.displayName,
    notes: block.notes,
    plannedSetsJson: toInputJson(block.plannedSetsJson),
    roundsPlanned: block.roundsPlanned,
    sortOrder: block.sortOrder,
    sourcePlioExerciseId: block.plioExerciseLibraryId,
    workSeconds: block.workSeconds,
    restSeconds: block.restSeconds,
    targetRpe: block.targetRpe,
  };
}

export function mapSessionMobilityCreate(
  block: TemplateMobilitySnapshot,
): Prisma.SessionMobilityBlockCreateWithoutSessionInput {
  return {
    coachInstructions: block.coachInstructions,
    displayName: block.displayName,
    notes: block.notes,
    plannedSetsJson: toInputJson(block.plannedSetsJson),
    roundsPlanned: block.roundsPlanned,
    sortOrder: block.sortOrder,
    sourceMobilityExerciseId: block.mobilityExerciseLibraryId,
    workSeconds: block.workSeconds,
    restSeconds: block.restSeconds,
    targetRpe: block.targetRpe,
  };
}

export function mapSessionIsometricCreate(
  block: TemplateIsometricSnapshot,
): Prisma.SessionIsometricBlockCreateWithoutSessionInput {
  return {
    coachInstructions: block.coachInstructions,
    displayName: block.displayName,
    notes: block.notes,
    plannedSetsJson: toInputJson(block.plannedSetsJson),
    restSeconds: block.restSeconds,
    setsPlanned: block.setsPlanned,
    sortOrder: block.sortOrder,
    sourceIsometricExerciseId: block.isometricExerciseLibraryId,
    targetRpe: block.targetRpe,
  };
}

export function mapSessionSportCreate(block: TemplateSportSnapshot): Prisma.SessionSportBlockCreateWithoutSessionInput {
  return {
    coachInstructions: block.coachInstructions,
    displayName: block.displayName,
    durationMinutes: block.durationMinutes,
    notes: block.notes,
    plannedSetsJson: toInputJson(block.plannedSetsJson),
    sortOrder: block.sortOrder,
    sourceSportId: block.sportLibraryId,
    targetRpe: block.targetRpe,
  };
}

export function mapTemplateExerciseSnapshot(exercise: {
  displayName: string;
  exerciseLibraryId: null | string;
  libraryExercise?: { coachInstructions: null | string } | null;
  notes: null | string;
  perSetWeightRangesJson: Prisma.JsonValue | null;
  repsMax: null | number;
  repsMin: null | number;
  restSeconds: null | number;
  sets: Array<{ setIndex: number; note?: null | string; advancedTechnique?: null | string }>;
  setsPlanned: null | number;
  sortOrder: number;
  targetRir: null | number;
  targetRpe: null | number;
  weightRangeMaxKg: Prisma.Decimal | null;
  weightRangeMinKg: Prisma.Decimal | null;
}): TemplateExerciseSnapshot {
  const noteSnapshot = buildSessionNoteSnapshot({
    coachInstructions: exercise.libraryExercise?.coachInstructions ?? null,
    notes: exercise.notes,
    sets: exercise.sets,
  });
  return {
    coachInstructions: noteSnapshot.coachInstructions,
    displayName: exercise.displayName,
    exerciseLibraryId: exercise.exerciseLibraryId,
    notes: noteSnapshot.notes,
    perSetWeightRangesJson: exercise.perSetWeightRangesJson,
    plannedSetsJson: plannedSetsJsonToInput(noteSnapshot.plannedSetsJson),
    repsMax: exercise.repsMax,
    repsMin: exercise.repsMin,
    restSeconds: exercise.restSeconds,
    setsPlanned: exercise.setsPlanned,
    sortOrder: exercise.sortOrder,
    targetRir: exercise.targetRir,
    targetRpe: exercise.targetRpe,
    weightRangeMaxKg: exercise.weightRangeMaxKg,
    weightRangeMinKg: exercise.weightRangeMinKg,
  };
}

export function mapTemplatePlioSnapshot(block: {
  displayName: string;
  libraryPlioExercise?: { coachInstructions: null | string } | null;
  notes: null | string;
  plioExerciseLibraryId: null | string;
  roundsPlanned: number;
  sets: Array<{ setIndex: number; note?: null | string; advancedTechnique?: null | string }>;
  sortOrder: number;
  workSeconds: number;
  restSeconds: number;
  targetRpe: null | number;
}): TemplatePlioSnapshot {
  const noteSnapshot = buildSessionNoteSnapshot({
    coachInstructions: block.libraryPlioExercise?.coachInstructions ?? null,
    notes: block.notes,
    sets: block.sets,
  });
  return {
    coachInstructions: noteSnapshot.coachInstructions,
    displayName: block.displayName,
    notes: noteSnapshot.notes,
    plannedSetsJson: plannedSetsJsonToInput(noteSnapshot.plannedSetsJson),
    plioExerciseLibraryId: block.plioExerciseLibraryId,
    roundsPlanned: block.roundsPlanned,
    sortOrder: block.sortOrder,
    workSeconds: block.workSeconds,
    restSeconds: block.restSeconds,
    targetRpe: block.targetRpe,
  };
}

export function mapTemplateMobilitySnapshot(block: {
  displayName: string;
  libraryMobilityExercise?: { coachInstructions: null | string } | null;
  mobilityExerciseLibraryId: null | string;
  notes: null | string;
  roundsPlanned: number;
  sets: Array<{ setIndex: number; note?: null | string; advancedTechnique?: null | string }>;
  sortOrder: number;
  workSeconds: number;
  restSeconds: number;
  targetRpe: null | number;
}): TemplateMobilitySnapshot {
  const noteSnapshot = buildSessionNoteSnapshot({
    coachInstructions: block.libraryMobilityExercise?.coachInstructions ?? null,
    notes: block.notes,
    sets: block.sets,
  });
  return {
    coachInstructions: noteSnapshot.coachInstructions,
    displayName: block.displayName,
    mobilityExerciseLibraryId: block.mobilityExerciseLibraryId,
    notes: noteSnapshot.notes,
    plannedSetsJson: plannedSetsJsonToInput(noteSnapshot.plannedSetsJson),
    roundsPlanned: block.roundsPlanned,
    sortOrder: block.sortOrder,
    workSeconds: block.workSeconds,
    restSeconds: block.restSeconds,
    targetRpe: block.targetRpe,
  };
}

export function mapTemplateIsometricSnapshot(block: {
  displayName: string;
  isometricExerciseLibraryId: null | string;
  libraryIsometricExercise?: { coachInstructions: null | string } | null;
  notes: null | string;
  restSeconds: number;
  sets: Array<{ setIndex: number; note?: null | string; advancedTechnique?: null | string }>;
  setsPlanned: null | number;
  sortOrder: number;
  targetRpe: null | number;
}): TemplateIsometricSnapshot {
  const noteSnapshot = buildSessionNoteSnapshot({
    coachInstructions: block.libraryIsometricExercise?.coachInstructions ?? null,
    notes: block.notes,
    sets: block.sets,
  });
  return {
    coachInstructions: noteSnapshot.coachInstructions,
    displayName: block.displayName,
    isometricExerciseLibraryId: block.isometricExerciseLibraryId,
    notes: noteSnapshot.notes,
    plannedSetsJson: plannedSetsJsonToInput(noteSnapshot.plannedSetsJson),
    restSeconds: block.restSeconds,
    setsPlanned: block.setsPlanned,
    sortOrder: block.sortOrder,
    targetRpe: block.targetRpe,
  };
}

export function mapTemplateSportSnapshot(block: {
  displayName: string;
  durationMinutes: number;
  librarySport?: { coachInstructions: null | string } | null;
  notes: null | string;
  sets: Array<{ setIndex: number; note?: null | string; advancedTechnique?: null | string }>;
  sortOrder: number;
  sportLibraryId: null | string;
  targetRpe: null | number;
}): TemplateSportSnapshot {
  const noteSnapshot = buildSessionNoteSnapshot({
    coachInstructions: block.librarySport?.coachInstructions ?? null,
    notes: block.notes,
    sets: block.sets,
  });
  return {
    coachInstructions: noteSnapshot.coachInstructions,
    displayName: block.displayName,
    durationMinutes: block.durationMinutes,
    notes: noteSnapshot.notes,
    plannedSetsJson: plannedSetsJsonToInput(noteSnapshot.plannedSetsJson),
    sortOrder: block.sortOrder,
    sportLibraryId: block.sportLibraryId,
    targetRpe: block.targetRpe,
  };
}

export function mapSetLog(row: {
  effortRir: null | number;
  effortRpe: null | number;
  repsDone: null | number;
  sessionItemId: string;
  setIndex: number;
  weightDoneKg: Prisma.Decimal | null;
}): SessionSetLog {
  return {
    effortRir: row.effortRir,
    effortRpe: row.effortRpe,
    repsDone: row.repsDone,
    sessionItemId: row.sessionItemId,
    setIndex: row.setIndex,
    weightDoneKg: row.weightDoneKg ? Number(row.weightDoneKg) : null,
  };
}

export function mapPlioSetLog(row: {
  effortRpe: null | number;
  repsDone: null | number;
  sessionPlioBlockId: string;
  setIndex: number;
  weightDoneKg: Prisma.Decimal | null;
}): SessionPlioSetLog {
  return {
    effortRpe: row.effortRpe,
    repsDone: row.repsDone,
    sessionPlioBlockId: row.sessionPlioBlockId,
    setIndex: row.setIndex,
    weightDoneKg: row.weightDoneKg ? Number(row.weightDoneKg) : null,
  };
}

export function mapMobilitySetLog(row: {
  effortRpe: null | number;
  repsDone: null | number;
  romDone: null | string;
  sessionMobilityBlockId: string;
  setIndex: number;
}): SessionMobilitySetLog {
  return {
    effortRpe: row.effortRpe,
    repsDone: row.repsDone,
    romDone: row.romDone,
    sessionMobilityBlockId: row.sessionMobilityBlockId,
    setIndex: row.setIndex,
  };
}

export function mapIsometricSetLog(row: {
  durationSecondsDone: null | number;
  effortRpe: null | number;
  sessionIsometricBlockId: string;
  setIndex: number;
  weightDoneKg: Prisma.Decimal | null;
}): SessionIsometricSetLog {
  return {
    durationSecondsDone: row.durationSecondsDone,
    effortRpe: row.effortRpe,
    sessionIsometricBlockId: row.sessionIsometricBlockId,
    setIndex: row.setIndex,
    weightDoneKg: row.weightDoneKg ? Number(row.weightDoneKg) : null,
  };
}

export function mapSportLog(row: {
  avgHeartRate: null | number;
  durationMinutesDone: null | number;
  effortRpe: null | number;
  sessionSportBlockId: string;
}): SessionSportLog {
  return {
    avgHeartRate: row.avgHeartRate,
    durationMinutesDone: row.durationMinutesDone,
    effortRpe: row.effortRpe,
    sessionSportBlockId: row.sessionSportBlockId,
  };
}

function toInputJson(value: Prisma.JsonValue | null): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}
