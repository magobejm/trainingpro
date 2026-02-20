import { LibraryItemScope, type Food } from '@prisma/client';
import type { CardioMethodWriteInput } from '../../domain/cardio-method.input';
import type { ExerciseWriteInput } from '../../domain/exercise.input';
import type { FoodWriteInput } from '../../domain/food.input';
import type { CardioMethodLibraryItem } from '../../domain/entities/cardio-method-library-item';
import type { ExerciseLibraryItem } from '../../domain/entities/exercise-library-item';
import type { FoodLibraryItem } from '../../domain/entities/food-library-item';
import type { LibraryCatalogItem } from '../../domain/entities/library-catalog-item';

type CardioMethodRow = {
  coachMembershipId: null | string;
  createdAt: Date;
  description: null | string;
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
  muscleGroupId: string;
  muscleGroupRef: { label: string };
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
    muscleGroup: row.muscleGroupRef.label,
    muscleGroupId: row.muscleGroupId,
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

export function normalizeCardioMethodInput(input: CardioMethodWriteInput) {
  return {
    description: toNullable(input.description),
    mediaType: toNullable(input.mediaType),
    mediaUrl: toNullable(input.mediaUrl),
    methodTypeId: input.methodTypeId.trim(),
    name: input.name.trim(),
    youtubeUrl: toNullable(input.youtubeUrl),
  };
}

export function normalizeExerciseInput(input: ExerciseWriteInput) {
  return {
    equipment: toNullable(input.equipment),
    instructions: toNullable(input.instructions),
    mediaType: toNullable(input.mediaType),
    mediaUrl: toNullable(input.mediaUrl),
    muscleGroupId: input.muscleGroupId.trim(),
    name: input.name.trim(),
    youtubeUrl: toNullable(input.youtubeUrl),
  };
}

export function normalizeFoodInput(input: FoodWriteInput) {
  return {
    caloriesKcal: input.caloriesKcal ?? null,
    carbsG: input.carbsG ?? null,
    fatG: input.fatG ?? null,
    foodCategory: toNullable(input.foodCategory),
    foodType: normalizeFoodType(input.foodType),
    mediaType: toNullable(input.mediaType),
    mediaUrl: toNullable(input.mediaUrl),
    name: input.name.trim(),
    notes: toNullable(input.notes),
    proteinG: input.proteinG ?? null,
    servingUnit: normalizeServingUnit(input.servingUnit),
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
