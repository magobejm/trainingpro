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

export function assertSessionMutable(status: SessionStatus): void {
  if (status === SessionStatus.COMPLETED) {
    throw new BadRequestException('Session already completed');
  }
}

export function mapSessionItemCreate(
  item: TemplateExerciseSnapshot,
): Prisma.SessionStrengthItemCreateWithoutSessionInput {
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

export function readFirstDayExercises(
  days: { exercises: TemplateExerciseSnapshot[] }[],
): null | TemplateExerciseSnapshot[] {
  const firstDay = days[0];
  if (!firstDay || firstDay.exercises.length === 0) {
    return null;
  }
  return firstDay.exercises;
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

function toInputJson(
  value: Prisma.JsonValue | null,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}
