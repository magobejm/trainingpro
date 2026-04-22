import { BadRequestException } from '@nestjs/common';
import { Prisma, SessionStatus } from '@prisma/client';
import type { SessionSetLog } from '../../domain/session.entity';

export type TemplateExerciseSnapshot = {
  displayName: string;
  exerciseLibraryId: null | string;
  perSetWeightRangesJson: Prisma.JsonValue | null;
  repsMax: null | number;
  repsMin: null | number;
  setsPlanned: null | number;
  sortOrder: number;
  weightRangeMaxKg: Prisma.Decimal | null;
  weightRangeMinKg: Prisma.Decimal | null;
};

export type TemplatePlioSnapshot = {
  displayName: string;
  plioExerciseLibraryId: null | string;
  roundsPlanned: number;
  sortOrder: number;
  workSeconds: number;
  restSeconds: number;
  targetRpe: null | number;
};

export type TemplateMobilitySnapshot = {
  displayName: string;
  mobilityExerciseLibraryId: null | string;
  roundsPlanned: number;
  sortOrder: number;
  workSeconds: number;
  restSeconds: number;
  targetRpe: null | number;
};

export type TemplateIsometricSnapshot = {
  displayName: string;
  isometricExerciseLibraryId: null | string;
  setsPlanned: null | number;
  sortOrder: number;
  targetRpe: null | number;
};

export type TemplateSportSnapshot = {
  displayName: string;
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
    displayName: item.displayName,
    perSetRangesJson: toInputJson(item.perSetWeightRangesJson),
    repsMax: item.repsMax,
    repsMin: item.repsMin,
    setsPlanned: item.setsPlanned,
    sortOrder: item.sortOrder,
    sourceExerciseId: item.exerciseLibraryId,
    weightRangeMaxKg: item.weightRangeMaxKg,
    weightRangeMinKg: item.weightRangeMinKg,
  };
}

export function readFirstDayExercises(days: { exercises: TemplateExerciseSnapshot[] }[]): null | TemplateExerciseSnapshot[] {
  const firstDay = days[0];
  if (!firstDay || firstDay.exercises.length === 0) {
    return null;
  }
  return firstDay.exercises;
}

export function readFirstDayPlioBlocks(days: { plioBlocks?: TemplatePlioSnapshot[] }[]): TemplatePlioSnapshot[] {
  return days[0]?.plioBlocks ?? [];
}

export function readFirstDayMobilityBlocks(
  days: { mobilityBlocks?: TemplateMobilitySnapshot[] }[],
): TemplateMobilitySnapshot[] {
  return days[0]?.mobilityBlocks ?? [];
}

export function readFirstDayIsometricBlocks(
  days: { isometricBlocks?: TemplateIsometricSnapshot[] }[],
): TemplateIsometricSnapshot[] {
  return days[0]?.isometricBlocks ?? [];
}

export function readFirstDaySportBlocks(days: { sportBlocks?: TemplateSportSnapshot[] }[]): TemplateSportSnapshot[] {
  return days[0]?.sportBlocks ?? [];
}

export function mapSessionPlioCreate(block: TemplatePlioSnapshot): Prisma.SessionPlioBlockCreateWithoutSessionInput {
  return {
    displayName: block.displayName,
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
    displayName: block.displayName,
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
    displayName: block.displayName,
    setsPlanned: block.setsPlanned,
    sortOrder: block.sortOrder,
    sourceIsometricExerciseId: block.isometricExerciseLibraryId,
    targetRpe: block.targetRpe,
  };
}

export function mapSessionSportCreate(block: TemplateSportSnapshot): Prisma.SessionSportBlockCreateWithoutSessionInput {
  return {
    displayName: block.displayName,
    durationMinutes: block.durationMinutes,
    sortOrder: block.sortOrder,
    sourceSportId: block.sportLibraryId,
    targetRpe: block.targetRpe,
  };
}

export function mapSetLog(row: {
  effortRpe: null | number;
  repsDone: null | number;
  sessionItemId: string;
  setIndex: number;
  weightDoneKg: Prisma.Decimal | null;
}): SessionSetLog {
  return {
    effortRpe: row.effortRpe,
    repsDone: row.repsDone,
    sessionItemId: row.sessionItemId,
    setIndex: row.setIndex,
    weightDoneKg: row.weightDoneKg ? Number(row.weightDoneKg) : null,
  };
}

function toInputJson(value: Prisma.JsonValue | null): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}
