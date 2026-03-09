import { LibraryItemScope, type Food } from '@prisma/client';
import type { CardioMethodWriteInput } from '../../domain/cardio-method.input';
import type { ExerciseWriteInput } from '../../domain/exercise.input';
import type { FoodWriteInput } from '../../domain/food.input';
import type { PlioExerciseWriteInput } from '../../domain/plio-exercise.input';
import type { WarmupExerciseWriteInput } from '../../domain/warmup-exercise.input';
import type { SportWriteInput } from '../../domain/sport.input';
import type { CardioMethodLibraryItem } from '../../domain/entities/cardio-method-library-item';
import type { ExerciseLibraryItem } from '../../domain/entities/exercise-library-item';
import type { FoodLibraryItem } from '../../domain/entities/food-library-item';
import type { LibraryCatalogItem } from '../../domain/entities/library-catalog-item';
import { normalizeMobilityType, normalizePlioType } from './library.specialized-mappers';

type CardioMethodRow = {
  coachMembershipId: null | string;
  createdAt: Date;
  description: null | string;
  equipment?: null | string;
  id: string;
  mediaType: null | string;
  mediaUrl: null | string;
  methodTypeId: string;
  methodTypeRef: { label: string };
  name: string;
  scope: LibraryItemScope;
  updatedAt: Date;
  youtubeUrl: null | string;
};

type ExerciseRow = {
  coachMembershipId: null | string;
  createdAt: Date;
  equipment: null | string;
  id: string;
  instructions: null | string;
  mediaType: null | string;
  mediaUrl: null | string;
  muscleGroups: { muscleGroup: { id: string; label: string } }[];
  name: string;
  scope: LibraryItemScope;
  updatedAt: Date;
  youtubeUrl: null | string;
};

type CatalogRow = {
  id: string;
  isDefault: boolean;
  label: string;
};

export function mapCardioMethod(row: CardioMethodRow): CardioMethodLibraryItem {
  return {
    coachMembershipId: row.coachMembershipId,
    createdAt: row.createdAt,
    description: row.description,
    equipment: row.equipment ?? null,
    id: row.id,
    media: { type: row.mediaType, url: row.mediaUrl },
    methodType: row.methodTypeRef.label,
    methodTypeId: row.methodTypeId,
    name: row.name,
    scope: toDomainScope(row.scope),
    updatedAt: row.updatedAt,
    youtubeUrl: row.youtubeUrl,
  };
}

export function mapExercise(row: ExerciseRow): ExerciseLibraryItem {
  return {
    coachMembershipId: row.coachMembershipId,
    createdAt: row.createdAt,
    equipment: row.equipment,
    id: row.id,
    instructions: row.instructions,
    media: { type: row.mediaType, url: row.mediaUrl },
    muscleGroup: row.muscleGroups.map((mg) => mg.muscleGroup.label).join(', '),
    muscleGroupId: row.muscleGroups[0]?.muscleGroup.id ?? '',
    name: row.name,
    scope: toDomainScope(row.scope),
    updatedAt: row.updatedAt,
    youtubeUrl: row.youtubeUrl,
  };
}

export function mapFood(row: Food): FoodLibraryItem {
  return {
    caloriesKcal: row.caloriesKcal,
    carbsG: row.carbsG,
    coachMembershipId: row.coachMembershipId,
    createdAt: row.createdAt,
    fatG: row.fatG,
    foodCategory: row.foodCategory,
    foodType: row.foodType,
    id: row.id,
    media: { type: row.mediaType, url: row.mediaUrl },
    name: row.name,
    notes: row.notes,
    proteinG: row.proteinG,
    scope: toDomainScope(row.scope),
    servingUnit: row.servingUnit,
    updatedAt: row.updatedAt,
  };
}

export function mapCatalogItem(row: CatalogRow): LibraryCatalogItem {
  return {
    id: row.id,
    isDefault: row.isDefault,
    label: row.label,
  };
}

export function normalizeCardioMethodInput(input: CardioMethodWriteInput): CardioMethodWriteInput;
export function normalizeCardioMethodInput(input: Partial<CardioMethodWriteInput>): Partial<CardioMethodWriteInput>;
export function normalizeCardioMethodInput(input: Partial<CardioMethodWriteInput>): Partial<CardioMethodWriteInput> {
  return {
    ...(input.description !== undefined && { description: toNullable(input.description) }),
    ...(input.equipment !== undefined && { equipment: toNullable(input.equipment) }),
    ...(input.mediaType !== undefined && { mediaType: toNullable(input.mediaType) }),
    ...(input.mediaUrl !== undefined && { mediaUrl: toNullable(input.mediaUrl) }),
    ...(input.methodTypeId !== undefined && { methodTypeId: input.methodTypeId.trim() }),
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(input.youtubeUrl !== undefined && { youtubeUrl: toNullable(input.youtubeUrl) }),
  };
}

export function normalizeExerciseInput(input: ExerciseWriteInput): ExerciseWriteInput;
export function normalizeExerciseInput(input: Partial<ExerciseWriteInput>): Partial<ExerciseWriteInput>;
export function normalizeExerciseInput(input: Partial<ExerciseWriteInput>): Partial<ExerciseWriteInput> {
  return {
    ...(input.equipment !== undefined && { equipment: toNullable(input.equipment) }),
    ...(input.instructions !== undefined && { instructions: toNullable(input.instructions) }),
    ...(input.mediaType !== undefined && { mediaType: toNullable(input.mediaType) }),
    ...(input.mediaUrl !== undefined && { mediaUrl: toNullable(input.mediaUrl) }),
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(input.youtubeUrl !== undefined && { youtubeUrl: toNullable(input.youtubeUrl) }),
  };
}

export function normalizeFoodInput(input: FoodWriteInput): FoodWriteInput;
export function normalizeFoodInput(input: Partial<FoodWriteInput>): Partial<FoodWriteInput>;
export function normalizeFoodInput(input: Partial<FoodWriteInput>): Partial<FoodWriteInput> {
  return {
    ...(input.caloriesKcal !== undefined && { caloriesKcal: input.caloriesKcal ?? null }),
    ...(input.carbsG !== undefined && { carbsG: input.carbsG ?? null }),
    ...(input.fatG !== undefined && { fatG: input.fatG ?? null }),
    ...(input.foodCategory !== undefined && { foodCategory: toNullable(input.foodCategory) }),
    ...(input.foodType !== undefined && { foodType: normalizeFoodType(input.foodType) }),
    ...(input.mediaType !== undefined && { mediaType: toNullable(input.mediaType) }),
    ...(input.mediaUrl !== undefined && { mediaUrl: toNullable(input.mediaUrl) }),
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(input.notes !== undefined && { notes: toNullable(input.notes) }),
    ...(input.proteinG !== undefined && { proteinG: input.proteinG ?? null }),
    ...(input.servingUnit !== undefined && {
      servingUnit: normalizeServingUnit(input.servingUnit) ?? undefined,
    }),
  };
}

export function normalizePlioExerciseInput(input: PlioExerciseWriteInput): PlioExerciseWriteInput;
export function normalizePlioExerciseInput(input: Partial<PlioExerciseWriteInput>): Partial<PlioExerciseWriteInput>;
export function normalizePlioExerciseInput(input: Partial<PlioExerciseWriteInput>): Partial<PlioExerciseWriteInput> {
  return {
    ...(input.description !== undefined && { description: toNullable(input.description) }),
    ...(input.equipment !== undefined && { equipment: toNullable(input.equipment) }),
    ...(input.mediaType !== undefined && { mediaType: toNullable(input.mediaType) }),
    ...(input.mediaUrl !== undefined && { mediaUrl: toNullable(input.mediaUrl) }),
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(input.plioType !== undefined && { plioType: normalizePlioType(input.plioType) }),
    ...(input.notes !== undefined && { notes: toNullable(input.notes) }),
    ...(input.youtubeUrl !== undefined && { youtubeUrl: toNullable(input.youtubeUrl) }),
  };
}

export function normalizeWarmupExerciseInput(input: WarmupExerciseWriteInput): WarmupExerciseWriteInput;
export function normalizeWarmupExerciseInput(input: Partial<WarmupExerciseWriteInput>): Partial<WarmupExerciseWriteInput>;
export function normalizeWarmupExerciseInput(input: Partial<WarmupExerciseWriteInput>): Partial<WarmupExerciseWriteInput> {
  return {
    ...(input.description !== undefined && { description: toNullable(input.description) }),
    ...(input.mobilityType !== undefined && {
      mobilityType: normalizeMobilityType(input.mobilityType),
    }),
    ...(input.mediaType !== undefined && { mediaType: toNullable(input.mediaType) }),
    ...(input.mediaUrl !== undefined && { mediaUrl: toNullable(input.mediaUrl) }),
    ...(input.name !== undefined && { name: input.name.trim() }),
    ...(input.youtubeUrl !== undefined && { youtubeUrl: toNullable(input.youtubeUrl) }),
  };
}

export function normalizeSportInput(input: SportWriteInput): SportWriteInput;
export function normalizeSportInput(input: Partial<SportWriteInput>): Partial<SportWriteInput>;
export function normalizeSportInput(input: Partial<SportWriteInput>): Partial<SportWriteInput> {
  return {
    ...(input.description !== undefined && { description: toNullable(input.description) }),
    ...(input.icon !== undefined && { icon: input.icon.trim() }),
    ...(input.mediaUrl !== undefined && { mediaUrl: toNullable(input.mediaUrl) }),
    ...(input.name !== undefined && { name: input.name.trim() }),
  };
}

function toDomainScope(scope: LibraryItemScope): 'coach' | 'global' {
  return scope === LibraryItemScope.COACH ? 'coach' : 'global';
}

function toNullable(value: null | string | undefined): null | string {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }
  return normalized;
}

function normalizeFoodType(value: null | string | undefined): null | string {
  const normalized = toNullable(value)?.toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === 'ingrediente' || normalized === 'plato') {
    return normalized;
  }
  return null;
}

function normalizeServingUnit(value: null | string | undefined): null | string {
  const normalized = toNullable(value)?.toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized === '100g' || normalized === '100ml' || normalized === 'porcion') {
    return normalized;
  }
  if (normalized === 'g' || normalized === 'gramos') {
    return '100g';
  }
  if (normalized === 'ml' || normalized === 'mililitros') {
    return '100ml';
  }
  if (normalized === 'unidad') {
    return 'porcion';
  }
  return null;
}
