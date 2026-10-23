import { nutritionAmountTotals } from '../coach-planner';
import {
  readFreePlanContent,
  readSetupData,
  readStructuredPlanContent,
  type FreePlanItem,
  type PlanSetupData,
  type StructuredDayMeal,
} from './nutrition';

const DAY_MS = 86_400_000;
const MEAL_CATEGORY_ORDER = ['breakfast', 'lunch', 'dinner', 'snack', 'other'] as const;

export type MacroTotals = {
  caloriesKcal: number;
  carbsG: number;
  fatG: number;
  proteinG: number;
};

export type MacroComparison = {
  key: keyof MacroTotals;
  percent: number | null;
  target: number | null;
  value: number;
};

export type FoodMacroSource = {
  caloriesKcal?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  id: string;
  name?: string;
  proteinG?: number | null;
  servingUnit?: string | null;
};

export type MealMacroSource = {
  id: string;
  ingredients?: Array<{ amountGrams: number; food: FoodMacroSource; foodId: string }>;
  name: string;
};

export type ResolvedFoodItem = {
  amountGrams?: number;
  foodId?: string;
  mealId?: string;
  name: string;
};

export type ResolvedMeal = {
  category?: string;
  items: ResolvedFoodItem[];
  key: string;
  name: string;
  time?: string;
};

export type ResolvedPlanDay = {
  dayIndex: number;
  dayLabel: string | null;
  empty: boolean;
  meals: ResolvedMeal[];
  weekIndex: number;
  weekLabel: string | null;
};

export type DayMealMacros = Omit<ResolvedMeal, 'items'> & {
  items: Array<ResolvedFoodItem & { totals: MacroTotals }>;
  totals: MacroTotals;
};

type PlanInput = {
  assignedAt?: string | null;
  content: unknown;
  type: 'ESTRUCTURADO' | 'LIBRE';
};

export function shiftPlanDate(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function resolvePlanDay(plan: PlanInput, assignedAt: Date | string | null | undefined, date: Date): ResolvedPlanDay {
  if (plan.type === 'LIBRE') return resolveFreeDay(plan, date);
  return resolveStructuredDay(plan, assignedAt ?? plan.assignedAt, date);
}

export function buildDayMacros(
  day: ResolvedPlanDay,
  meals: MealMacroSource[],
  foods: FoodMacroSource[],
): {
  meals: DayMealMacros[];
  total: MacroTotals;
} {
  const resolved = day.meals.map((meal) => resolveMealMacros(meal, meals, foods));
  return { meals: resolved, total: sumTotals(resolved.map((meal) => meal.totals)) };
}

export function compareToTarget(total: MacroTotals, setup: PlanSetupData | null): MacroComparison[] {
  const data = setup ?? {};
  return [
    compare('caloriesKcal', total.caloriesKcal, data.targetCalories),
    compare('proteinG', total.proteinG, data.proteinG),
    compare('carbsG', total.carbsG, data.carbsG),
    compare('fatG', total.fatG, data.fatG),
  ];
}

export function readPlanSetup(value: unknown): PlanSetupData | null {
  return readSetupData(value);
}

function resolveFreeDay(plan: PlanInput, date: Date): ResolvedPlanDay {
  const content = readFreePlanContent(plan.content);
  const columns = content?.columns ?? {};
  const categories = [...MEAL_CATEGORY_ORDER, ...Object.keys(columns).filter((key) => !isKnownCategory(key))];
  const meals = categories.flatMap((category) => freeMeal(category, columns[category] ?? []));
  return { dayIndex: weekdayIndex(date), dayLabel: null, empty: meals.length === 0, meals, weekIndex: 0, weekLabel: null };
}

function resolveStructuredDay(plan: PlanInput, assignedAt: Date | string | null | undefined, date: Date): ResolvedPlanDay {
  const weeks = readStructuredPlanContent(plan.content)?.weeks ?? [];
  const weekIndex = weeks.length === 0 ? 0 : weekOffset(assignedAt, date, weeks.length);
  const week = weeks[weekIndex];
  const day = week?.days[weekdayIndex(date)];
  const source = day?.meals ?? day?.days ?? [];
  const meals = source.map(structuredMeal);
  return {
    dayIndex: weekdayIndex(date),
    dayLabel: day?.label ?? null,
    empty: !day || meals.length === 0,
    meals,
    weekIndex,
    weekLabel: week?.label ?? null,
  };
}

function freeMeal(category: string, items: FreePlanItem[]): ResolvedMeal[] {
  if (items.length === 0) return [];
  return [
    {
      category,
      items: items.map((item) => ({
        amountGrams: item.amountGrams,
        foodId: item.foodId,
        mealId: item.mealId,
        name: item.type === 'meal' ? (item.mealName ?? item.foodName ?? '') : (item.foodName ?? item.mealName ?? ''),
      })),
      key: category,
      name: category,
    },
  ];
}

function structuredMeal(meal: StructuredDayMeal): ResolvedMeal {
  return {
    items: [{ mealId: meal.mealId, name: meal.name }],
    key: meal.id,
    name: meal.name,
    time: meal.time,
  };
}

function resolveMealMacros(meal: ResolvedMeal, meals: MealMacroSource[], foods: FoodMacroSource[]): DayMealMacros {
  const items = meal.items.flatMap((item) => expandItem(item, meals, foods));
  return { ...meal, items, totals: sumTotals(items.map((item) => item.totals)) };
}

function expandItem(
  item: ResolvedFoodItem,
  meals: MealMacroSource[],
  foods: FoodMacroSource[],
): Array<ResolvedFoodItem & { totals: MacroTotals }> {
  if (item.mealId) return expandMeal(item.mealId, meals);
  if (!item.foodId) return [{ ...item, totals: zeroTotals() }];
  const food = foods.find((candidate) => candidate.id === item.foodId);
  const amount = item.amountGrams ?? (food?.servingUnit === 'porcion' ? 1 : 0);
  return [{ ...item, amountGrams: amount, name: item.name || food?.name || '', totals: scaleFood(food, amount) }];
}

function expandMeal(mealId: string, meals: MealMacroSource[]): Array<ResolvedFoodItem & { totals: MacroTotals }> {
  const meal = meals.find((candidate) => candidate.id === mealId);
  return (meal?.ingredients ?? []).map((ingredient) => ({
    amountGrams: ingredient.amountGrams,
    foodId: ingredient.foodId,
    name: ingredient.food.name ?? '',
    totals: scaleFood(ingredient.food, ingredient.amountGrams),
  }));
}

function scaleFood(food: FoodMacroSource | undefined, amount: number): MacroTotals {
  if (!food) return zeroTotals();
  const scaled = nutritionAmountTotals(food, amount);
  return {
    caloriesKcal: scaled.caloriesKcal ?? 0,
    carbsG: scaled.carbsG ?? 0,
    fatG: scaled.fatG ?? 0,
    proteinG: scaled.proteinG ?? 0,
  };
}

function sumTotals(rows: MacroTotals[]): MacroTotals {
  return rows.reduce(
    (total, row) => ({
      caloriesKcal: roundMacro(total.caloriesKcal + row.caloriesKcal),
      carbsG: roundMacro(total.carbsG + row.carbsG),
      fatG: roundMacro(total.fatG + row.fatG),
      proteinG: roundMacro(total.proteinG + row.proteinG),
    }),
    zeroTotals(),
  );
}

function compare(key: keyof MacroTotals, value: number, target: number | undefined): MacroComparison {
  const safeTarget = typeof target === 'number' && target > 0 ? target : null;
  return { key, percent: safeTarget === null ? null : Math.round((value / safeTarget) * 100), target: safeTarget, value };
}

function weekOffset(assignedAt: Date | string | null | undefined, date: Date, weekCount: number): number {
  const start = mondayOf(assignedAt ? new Date(assignedAt) : date).getTime();
  const weeks = Math.floor((mondayOf(date).getTime() - start) / (7 * DAY_MS));
  return ((weeks % weekCount) + weekCount) % weekCount;
}

function mondayOf(date: Date): Date {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = day.getDay();
  day.setDate(day.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return day;
}

function weekdayIndex(date: Date): number {
  const weekday = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getDay();
  return weekday === 0 ? 6 : weekday - 1;
}

function isKnownCategory(key: string): boolean {
  return MEAL_CATEGORY_ORDER.includes(key as (typeof MEAL_CATEGORY_ORDER)[number]);
}

function roundMacro(value: number): number {
  return Math.round(value * 100) / 100;
}

function zeroTotals(): MacroTotals {
  return { caloriesKcal: 0, carbsG: 0, fatG: 0, proteinG: 0 };
}
