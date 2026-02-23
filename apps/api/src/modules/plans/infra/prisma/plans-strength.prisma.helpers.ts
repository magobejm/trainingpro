import { FieldMode, Prisma } from '@prisma/client';
import { PlanTemplate } from '../../domain/entities/plan-template.entity';
import { PlanStrengthExerciseInput, PlanTemplateDayInput } from '../../domain/plan-template.input';

export function mapDayCreate(day: PlanTemplateDayInput): Prisma.PlanDayCreateWithoutTemplateInput {
  return {
    dayIndex: day.dayIndex,
    title: day.title.trim(),
    exercises: { create: day.exercises.map(mapExerciseCreate) },
  };
}

export function mapExerciseCreate(
  exercise: PlanStrengthExerciseInput,
): Prisma.PlanStrengthExerciseCreateWithoutDayInput {
  return {
    displayName: exercise.displayName.trim(),
    fieldModes: {
      create: exercise.fieldModes.map((entry) => ({
        fieldKey: entry.fieldKey.trim(),
        mode: entry.mode as FieldMode,
      })),
    },
    libraryExercise: connectExercise(exercise.exerciseLibraryId),
    notes: normalizeText(exercise.notes),
    perSetWeightRangesJson: normalizePerSetRanges(exercise),
    repsMax: exercise.repsMax ?? null,
    repsMin: exercise.repsMin ?? null,
    restSeconds: exercise.restSeconds ?? 0,
    setsPlanned: exercise.setsPlanned ?? null,
    targetRir: exercise.targetRir ?? null,
    targetRpe: exercise.targetRpe ?? null,
    sortOrder: exercise.sortOrder,
    weightRangeMaxKg: toDecimal(exercise.weightRangeMaxKg),
    weightRangeMinKg: toDecimal(exercise.weightRangeMinKg),
  };
}

export function connectExercise(exerciseLibraryId: null | string | undefined) {
  if (!exerciseLibraryId) {
    return undefined;
  }
  return { connect: { id: exerciseLibraryId } };
}

export function normalizePerSetRanges(
  exercise: PlanStrengthExerciseInput,
): Prisma.InputJsonValue | undefined {
  if (!exercise.perSetWeightRanges || exercise.perSetWeightRanges.length === 0) {
    return undefined;
  }
  return exercise.perSetWeightRanges.map((entry) => ({
    maxKg: entry.maxKg ?? null,
    minKg: entry.minKg ?? null,
  })) as Prisma.InputJsonValue;
}

export function normalizeText(value: null | string | undefined): null | string {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function toDecimal(value: null | number | undefined) {
  return typeof value === 'number' ? new Prisma.Decimal(value) : null;
}

export function mapTemplate(
  row: Prisma.PlanTemplateGetPayload<{ include: ReturnType<typeof templateInclude> }>,
): PlanTemplate {
  return {
    createdAt: row.createdAt,
    days: row.days.map(mapTemplateDay),
    id: row.id,
    name: row.name,
    templateVersion: row.templateVersion,
    updatedAt: row.updatedAt,
  };
}

export function mapTemplateDay(
  day: Prisma.PlanDayGetPayload<{
    include: { exercises: { include: { fieldModes: true } } };
  }>,
) {
  return {
    dayIndex: day.dayIndex,
    exercises: day.exercises.map(mapTemplateExercise),
    id: day.id,
    title: day.title,
  };
}

export function mapTemplateExercise(
  exercise: Prisma.PlanStrengthExerciseGetPayload<{ include: { fieldModes: true } }>,
) {
  return {
    displayName: exercise.displayName,
    exerciseLibraryId: exercise.exerciseLibraryId,
    fieldModes: exercise.fieldModes.map((entry) => ({
      fieldKey: entry.fieldKey,
      mode: entry.mode,
    })),
    id: exercise.id,
    notes: exercise.notes,
    prescription: {
      defaultWeightRange: {
        maxKg: toNumber(exercise.weightRangeMaxKg),
        minKg: toNumber(exercise.weightRangeMinKg),
      },
      perSetWeightRanges: readPerSetRanges(exercise.perSetWeightRangesJson),
      repsMax: exercise.repsMax,
      repsMin: exercise.repsMin,
      restSeconds: exercise.restSeconds,
      setsPlanned: exercise.setsPlanned,
      targetRir: exercise.targetRir,
      targetRpe: exercise.targetRpe,
    },
    sortOrder: exercise.sortOrder,
  };
}

export function readPerSetRanges(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => {
    const item = entry as { maxKg?: number | null; minKg?: number | null };
    return { maxKg: item.maxKg ?? null, minKg: item.minKg ?? null };
  });
}

export function templateInclude() {
  return {
    days: {
      include: {
        exercises: {
          include: { fieldModes: true },
          orderBy: { sortOrder: 'asc' as const },
          where: { archivedAt: null },
        },
      },
      orderBy: { dayIndex: 'asc' as const },
      where: { archivedAt: null },
    },
  };
}

export function toNumber(value: Prisma.Decimal | null): null | number {
  return value ? Number(value) : null;
}
