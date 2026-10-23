import { resolvePlanDay, shiftPlanDate, type FoodMacroSource, type MealMacroSource } from './nutrition-day';
import { nutritionAmountTotals } from '../coach-planner';

export type ShoppingLine = {
  category: string;
  foodId: string;
  grams: number;
  name: string;
};

export type ShoppingGroup = {
  category: string;
  items: ShoppingLine[];
};

type PlanInput = {
  assignedAt?: string | null;
  content: unknown;
  type: 'ESTRUCTURADO' | 'LIBRE';
};

export function buildShoppingList(
  plan: PlanInput,
  assignedAt: Date | string | null | undefined,
  date: Date,
  meals: MealMacroSource[],
  foods: Array<FoodMacroSource & { foodCategory?: string | null }>,
): ShoppingGroup[] {
  const totals = new Map<string, ShoppingLine>();
  for (const day of weekDates(date)) {
    const resolved = resolvePlanDay(plan, assignedAt ?? plan.assignedAt, day);
    for (const meal of resolved.meals) collectMeal(meal.items, meals, foods, totals);
  }
  return groupLines([...totals.values()]);
}

export type SubstituteOption = {
  foodId: string;
  grams: number;
  name: string;
};

export function rankSubstitutes(source: FoodMacroSource, grams: number, candidates: FoodMacroSource[]): SubstituteOption[] {
  const raw = nutritionAmountTotals(source, grams);
  const target = {
    caloriesKcal: raw.caloriesKcal ?? 0,
    carbsG: raw.carbsG ?? 0,
    fatG: raw.fatG ?? 0,
    proteinG: raw.proteinG ?? 0,
  };
  if (target.caloriesKcal <= 0) return [];
  return candidates
    .filter((food) => food.id !== source.id && (food.caloriesKcal ?? 0) > 0)
    .map((food) => toOption(food, target))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 5)
    .map((option) => ({ foodId: option.foodId, grams: option.grams, name: option.name }));
}

function weekDates(date: Date): Date[] {
  const monday = shiftPlanDate(date, -((date.getDay() + 6) % 7));
  return [0, 1, 2, 3, 4, 5, 6].map((offset) => shiftPlanDate(monday, offset));
}

function collectMeal(
  items: Array<{ amountGrams?: number; foodId?: string; mealId?: string; name: string }>,
  meals: MealMacroSource[],
  foods: Array<FoodMacroSource & { foodCategory?: string | null }>,
  totals: Map<string, ShoppingLine>,
): void {
  for (const item of items) {
    const meal = item.mealId ? meals.find((candidate) => candidate.id === item.mealId) : undefined;
    if (meal?.ingredients) {
      for (const ingredient of meal.ingredients) addFood(ingredient.foodId, ingredient.amountGrams, foods, totals);
      continue;
    }
    if (item.foodId) addFood(item.foodId, item.amountGrams ?? 0, foods, totals);
  }
}

function addFood(
  foodId: string,
  grams: number,
  foods: Array<FoodMacroSource & { foodCategory?: string | null }>,
  totals: Map<string, ShoppingLine>,
): void {
  const food = foods.find((candidate) => candidate.id === foodId);
  const current = totals.get(foodId) ?? {
    category: food?.foodCategory?.trim() || 'other',
    foodId,
    grams: 0,
    name: food?.name ?? '',
  };
  current.grams += grams;
  totals.set(foodId, current);
}

function groupLines(lines: ShoppingLine[]): ShoppingGroup[] {
  const groups = new Map<string, ShoppingLine[]>();
  for (const line of lines) {
    const rounded = { ...line, grams: Math.round(line.grams) };
    groups.set(line.category, [...(groups.get(line.category) ?? []), rounded]);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, items]) => ({ category, items: items.sort((left, right) => left.name.localeCompare(right.name)) }));
}

function toOption(
  food: FoodMacroSource,
  target: { caloriesKcal: number; carbsG: number; fatG: number; proteinG: number },
): SubstituteOption & { distance: number } {
  const perUnit = food.servingUnit === 'porcion' ? 1 : 100;
  const grams = Math.max(1, Math.round((target.caloriesKcal / (food.caloriesKcal ?? 1)) * perUnit));
  const totals = nutritionAmountTotals(food, grams);
  const distance =
    Math.abs((totals.proteinG ?? 0) - target.proteinG) +
    Math.abs((totals.carbsG ?? 0) - target.carbsG) +
    Math.abs((totals.fatG ?? 0) - target.fatG);
  return { distance, foodId: food.id, grams, name: food.name ?? '' };
}
