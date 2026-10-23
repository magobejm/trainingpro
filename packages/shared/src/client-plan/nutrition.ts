import type { NutritionPlan } from './types';
type PlanContent = Pick<NutritionPlan, 'type' | 'content'> & Partial<Pick<NutritionPlan, 'setupData' | 'description'>>;

export type PlanSetupData = {
  activityLevel?: string;
  carbsG?: number;
  carbsPct?: number;
  fatG?: number;
  fatPct?: number;
  proteinG?: number;
  proteinPct?: number;
  targetCalories?: number;
  tdee?: number;
};

export type FreePlanItem = {
  amountGrams?: number;
  foodId?: string;
  foodName?: string;
  id: string;
  mealId?: string;
  mealName?: string;
  type: 'food' | 'meal';
};

export type FreePlanContent = {
  columns: Record<string, FreePlanItem[]>;
};

export type StructuredDayMeal = {
  id: string;
  mealId?: string;
  name: string;
  time?: string;
};

export type StructuredDay = {
  days?: StructuredDayMeal[];
  id: string;
  label: string;
  meals?: StructuredDayMeal[];
};

export type StructuredWeek = {
  days: StructuredDay[];
  id: string;
  label: string;
};

export type StructuredPlanContent = {
  weeks: StructuredWeek[];
};

export type MealCategoryGroup = {
  category: string;
  items: Array<{
    foodId?: string;
    label: string;
    mealId?: string;
    sublabel?: string;
  }>;
};

const MEAL_CATEGORY_ORDER = ['breakfast', 'lunch', 'dinner', 'snack', 'other'] as const;

export function readSetupData(value: unknown): PlanSetupData | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Partial<PlanSetupData>;
  if (typeof data.tdee !== 'number' && typeof data.targetCalories !== 'number') return null;
  return data as PlanSetupData;
}

export function readFreePlanContent(value: unknown): FreePlanContent | null {
  if (!value || typeof value !== 'object') return null;
  const content = value as Partial<FreePlanContent>;
  if (!content.columns || typeof content.columns !== 'object') return null;
  return content as FreePlanContent;
}

export function readStructuredPlanContent(value: unknown): StructuredPlanContent | null {
  if (!value || typeof value !== 'object') return null;
  const content = value as Partial<StructuredPlanContent>;
  if (!Array.isArray(content.weeks)) return null;
  return content as StructuredPlanContent;
}

export function buildMealGroups(plan: PlanContent, weekIndex = 0): MealCategoryGroup[] {
  if (plan.type === 'LIBRE') {
    const content = readFreePlanContent(plan.content);
    if (!content) return [];
    const groups: MealCategoryGroup[] = [];
    for (const category of MEAL_CATEGORY_ORDER) {
      const items = content.columns[category] ?? [];
      if (items.length === 0) continue;
      groups.push({
        category,
        items: items.map((item) => ({
          foodId: item.foodId,
          label: item.type === 'meal' ? (item.mealName ?? '—') : (item.foodName ?? '—'),
          mealId: item.mealId,
          sublabel: item.type === 'food' && item.amountGrams != null ? `${item.amountGrams} g` : undefined,
        })),
      });
    }
    const extraKeys = Object.keys(content.columns).filter(
      (key) => !MEAL_CATEGORY_ORDER.includes(key as (typeof MEAL_CATEGORY_ORDER)[number]),
    );
    for (const category of extraKeys) {
      const items = content.columns[category] ?? [];
      if (items.length === 0) continue;
      groups.push({
        category,
        items: items.map((item) => ({
          foodId: item.foodId,
          label: item.type === 'meal' ? (item.mealName ?? '—') : (item.foodName ?? '—'),
          mealId: item.mealId,
          sublabel: item.amountGrams != null ? `${item.amountGrams} g` : undefined,
        })),
      });
    }
    return groups;
  }

  const content = readStructuredPlanContent(plan.content);
  const weeks = content?.weeks ?? [];
  const week = weeks[normalizeWeek(weekIndex, weeks.length)];
  if (!week) return [];
  const groups: MealCategoryGroup[] = [];
  for (const day of week.days) {
    const meals = day.meals ?? day.days ?? [];
    groups.push({
      category: day.label,
      items: meals.map((meal) => ({
        label: meal.name,
        mealId: meal.mealId,
        sublabel: meal.time,
      })),
    });
  }
  return groups;
}

export function hasNutritionPlanData(plan: PlanContent | undefined): boolean {
  if (!plan) return false;
  const setup = readSetupData(plan.setupData);
  const meals = buildMealGroups(plan);
  return Boolean(setup) || meals.length > 0 || Boolean(plan.description);
}

function normalizeWeek(weekIndex: number, weekCount: number): number {
  if (weekCount <= 0) return 0;
  return ((weekIndex % weekCount) + weekCount) % weekCount;
}
