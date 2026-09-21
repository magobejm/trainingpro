import { Prisma } from '@prisma/client';
import type { Consideration } from '../../nutrition-considerations/domain/evaluate-considerations';
import {
  computeMealTotals,
  evaluateFoodConsiderations,
  evaluateMealConsiderations,
} from '../../nutrition-considerations/domain/evaluate-considerations';
import type { NutrientProfile } from '../../nutrition-considerations/domain/nutrition-thresholds';
import type { FoodSnapshotRow } from '../infra/prisma/nutrition.repository';

export type MealFoodSnapshotOutput = NutrientProfile & {
  id: string;
  name: string;
  servingUnit: string | null;
};

export type MealIngredientOutput = {
  amountGrams: number;
  food: MealFoodSnapshotOutput;
  foodId: string;
  sortOrder: number;
};

export type MealTotalsOutput = NutrientProfile;

export type MealOutput = {
  category: string;
  considerations: Consideration[];
  id: string;
  ingredients: MealIngredientOutput[];
  name: string;
  notes: string | null;
  totals: MealTotalsOutput;
};

export type FoodConsiderationOutput = {
  considerations: Consideration[];
  id: string;
  name: string;
};

export function mapFoodSnapshot(food: FoodSnapshotRow): MealFoodSnapshotOutput {
  return {
    caloriesKcal: food.caloriesKcal,
    carbsG: food.carbsG,
    fatG: food.fatG,
    fiberG: toNumber(food.fiberG),
    id: food.id,
    micronutrients: food.micronutrients ?? [],
    name: food.name,
    proteinG: food.proteinG,
    saltG: toNumber(food.saltG),
    saturatedFatG: toNumber(food.saturatedFatG),
    servingUnit: food.servingUnit,
    sugarG: toNumber(food.sugarG),
    unsaturatedFatG: toNumber(food.unsaturatedFatG),
  };
}

export function mapMeal(row: {
  category: string;
  id: string;
  ingredients: Array<{
    amountGrams: Prisma.Decimal;
    food: FoodSnapshotRow;
    foodId: string;
    sortOrder: number;
  }>;
  name: string;
  notes: string | null;
}): MealOutput {
  const ingredients = row.ingredients.map((ingredient) => ({
    amountGrams: toNumber(ingredient.amountGrams) ?? 0,
    food: mapFoodSnapshot(ingredient.food),
    foodId: ingredient.foodId,
    sortOrder: ingredient.sortOrder,
  }));
  const totals = computeMealTotals(ingredients);
  return {
    category: row.category,
    considerations: evaluateMealConsiderations(totals, row.id),
    id: row.id,
    ingredients,
    name: row.name,
    notes: row.notes,
    totals,
  };
}

export function mapFoodConsideration(food: FoodSnapshotRow): FoodConsiderationOutput {
  const snapshot = mapFoodSnapshot(food);
  return {
    considerations: evaluateFoodConsiderations(snapshot, food.id),
    id: food.id,
    name: food.name,
  };
}

export function collectPlanRefIds(content: unknown): { foodIds: string[]; mealIds: string[] } {
  const foodIds = new Set<string>();
  const mealIds = new Set<string>();
  walk(content, foodIds, mealIds);
  return { foodIds: [...foodIds], mealIds: [...mealIds] };
}

function walk(node: unknown, foodIds: Set<string>, mealIds: Set<string>): void {
  if (Array.isArray(node)) {
    node.forEach((item) => walk(item, foodIds, mealIds));
    return;
  }
  if (!node || typeof node !== 'object') {
    return;
  }
  const record = node as Record<string, unknown>;
  if (typeof record.foodId === 'string' && record.foodId) {
    foodIds.add(record.foodId);
  }
  if (typeof record.mealId === 'string' && record.mealId) {
    mealIds.add(record.mealId);
  }
  Object.values(record).forEach((value) => walk(value, foodIds, mealIds));
}

function toNumber(value: Prisma.Decimal | null | number): number | null {
  if (value === null) {
    return null;
  }
  return Number(value);
}
