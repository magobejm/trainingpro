import { NotFoundException } from '@nestjs/common';
import { LibraryItemScope, Prisma } from '@prisma/client';
import type { CardioMethodFilter } from '../../domain/cardio-method.input';
import type { ExerciseFilter } from '../../domain/exercise.input';
import type { FoodFilter } from '../../domain/food.input';
import type { PlioExerciseFilter } from '../../domain/plio-exercise.input';
import type { WarmupExerciseFilter } from '../../domain/warmup-exercise.input';

export function buildCardioMethodWhere(coachMembershipId: string, filter: CardioMethodFilter) {
  return {
    ...buildLibraryScopeWhere(coachMembershipId),
    methodTypeId: equalsFilter(filter.methodTypeId),
    name: containsFilter(filter.query),
  } satisfies Prisma.CardioMethodWhereInput;
}

export function buildExerciseWhere(coachMembershipId: string, filter: ExerciseFilter) {
  return {
    ...buildLibraryScopeWhere(coachMembershipId),
    ...(filter.muscleGroupId && {
      muscleGroups: { some: { muscleGroupId: filter.muscleGroupId } },
    }),
    name: containsFilter(filter.query),
  } satisfies Prisma.ExerciseWhereInput;
}

export function buildFoodWhere(coachMembershipId: string, filter: FoodFilter) {
  return {
    ...buildLibraryScopeWhere(coachMembershipId),
    foodCategory: containsFilter(filter.foodCategory),
    foodType: containsFilter(filter.foodType),
    name: containsFilter(filter.query),
    servingUnit: equalsFilter(filter.servingUnit),
  } satisfies Prisma.FoodWhereInput;
}

export function buildPlioWhere(coachMembershipId: string, filter: PlioExerciseFilter) {
  const base = {
    ...buildLibraryScopeWhere(coachMembershipId),
    name: containsFilter(filter.query),
  } as Record<string, unknown>;
  if (filter.plioType?.trim()) {
    base.plioType = equalsFilter(filter.plioType);
  }
  return base as Prisma.PlioExerciseWhereInput;
}

export function buildWarmupWhere(coachMembershipId: string, filter: WarmupExerciseFilter) {
  const base = {
    ...buildLibraryScopeWhere(coachMembershipId),
    name: containsFilter(filter.query),
  } as Record<string, unknown>;
  if (filter.mobilityType?.trim()) {
    base.mobilityType = equalsFilter(filter.mobilityType);
  }
  return base as Prisma.WarmupExerciseWhereInput;
}

export function buildSportWhere(coachMembershipId: string, query?: string) {
  return {
    ...buildLibraryScopeWhere(coachMembershipId),
    name: containsFilter(query),
  } satisfies Prisma.SportWhereInput;
}

export function toDomainScope(scope: LibraryItemScope): 'coach' | 'global' {
  return scope === LibraryItemScope.COACH ? 'coach' : 'global';
}

export async function assertCatalogExists(read: () => Promise<null | unknown>, message: string): Promise<void> {
  const row = await read();
  if (!row) {
    throw new NotFoundException(message);
  }
}

function buildLibraryScopeWhere(coachMembershipId: string) {
  return {
    OR: [{ scope: LibraryItemScope.GLOBAL }, { coachMembershipId, scope: LibraryItemScope.COACH }],
    archivedAt: null,
  };
}

function containsFilter(value: string | undefined) {
  if (!value?.trim()) {
    return undefined;
  }
  return { contains: value.trim(), mode: Prisma.QueryMode.insensitive };
}

function equalsFilter(value: string | undefined) {
  if (!value?.trim()) {
    return undefined;
  }
  return value.trim();
}
