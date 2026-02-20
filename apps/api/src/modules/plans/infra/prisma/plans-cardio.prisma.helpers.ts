import { FieldMode, Prisma } from '@prisma/client';
import type { PlanCardioTemplate } from '../../domain/entities/cardio-template.entity';
import type {
  PlanCardioBlockInput,
  PlanCardioTemplateDayInput,
} from '../../domain/plan-cardio.input';

export function mapCardioDayCreate(
  day: PlanCardioTemplateDayInput,
): Prisma.PlanDayCreateWithoutTemplateInput {
  return {
    cardioBlocks: { create: day.cardioBlocks.map(mapCardioBlockCreate) },
    dayIndex: day.dayIndex,
    title: day.title.trim(),
  };
}

export function mapCardioTemplate(
  row: Prisma.PlanTemplateGetPayload<{ include: ReturnType<typeof cardioTemplateInclude> }>,
): PlanCardioTemplate {
  return {
    createdAt: row.createdAt,
    days: row.days.map(mapCardioDay),
    id: row.id,
    name: row.name,
    templateVersion: row.templateVersion,
    updatedAt: row.updatedAt,
  };
}

export function cardioTemplateInclude() {
  return {
    days: {
      include: {
        cardioBlocks: {
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

function mapCardioBlockCreate(
  block: PlanCardioBlockInput,
): Prisma.PlanCardioBlockCreateWithoutDayInput {
  return {
    displayName: block.displayName.trim(),
    fieldModes: {
      create: block.fieldModes.map((entry) => ({
        fieldKey: entry.fieldKey.trim(),
        mode: entry.mode as FieldMode,
      })),
    },
    libraryCardioMethod: connectCardioMethod(block.cardioMethodLibraryId),
    notes: normalizeText(block.notes),
    restSeconds: block.restSeconds ?? 0,
    roundsPlanned: block.roundsPlanned ?? 1,
    sortOrder: block.sortOrder,
    targetDistanceMeters: block.targetDistanceMeters ?? null,
    targetRpe: block.targetRpe ?? null,
    workSeconds: block.workSeconds,
  };
}

function mapCardioDay(
  day: Prisma.PlanDayGetPayload<{ include: { cardioBlocks: { include: { fieldModes: true } } } }>,
) {
  return {
    cardioBlocks: day.cardioBlocks.map(mapCardioBlock),
    dayIndex: day.dayIndex,
    id: day.id,
    title: day.title,
  };
}

function mapCardioBlock(
  block: Prisma.PlanCardioBlockGetPayload<{ include: { fieldModes: true } }>,
) {
  return {
    cardioMethodLibraryId: block.cardioMethodLibraryId,
    displayName: block.displayName,
    fieldModes: block.fieldModes.map((entry) => ({
      fieldKey: entry.fieldKey,
      mode: entry.mode,
    })),
    id: block.id,
    notes: block.notes,
    restSeconds: block.restSeconds,
    roundsPlanned: block.roundsPlanned,
    sortOrder: block.sortOrder,
    targetDistanceMeters: block.targetDistanceMeters,
    targetRpe: block.targetRpe,
    workSeconds: block.workSeconds,
  };
}

function connectCardioMethod(cardioMethodLibraryId: null | string | undefined) {
  if (!cardioMethodLibraryId) {
    return undefined;
  }
  return { connect: { id: cardioMethodLibraryId } };
}

function normalizeText(value: null | string | undefined): null | string {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
