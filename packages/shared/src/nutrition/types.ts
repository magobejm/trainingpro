export type NutritionConsideration = {
  code: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  tone: 'bad' | 'good' | 'neutral';
  values?: { x?: number };
  variant: number;
};

export type MealIngredient = {
  amountGrams: number;
  food: {
    caloriesKcal: null | number;
    carbsG: null | number;
    fatG: null | number;
    fiberG?: null | number;
    id: string;
    micronutrients?: string[];
    name: string;
    proteinG: null | number;
    saltG?: null | number;
    saturatedFatG?: null | number;
    servingUnit?: null | string;
    sugarG?: null | number;
    unsaturatedFatG?: null | number;
  };
  foodId: string;
  sortOrder: number;
};

export type NutritionMeal = {
  category: string;
  considerations?: NutritionConsideration[];
  id: string;
  ingredients: MealIngredient[];
  name: string;
  notes: null | string;
  totals?: {
    caloriesKcal?: null | number;
    carbsG?: null | number;
    fatG?: null | number;
    fiberG?: null | number;
    proteinG?: null | number;
    saltG?: null | number;
    saturatedFatG?: null | number;
    sugarG?: null | number;
  };
};

export type NutritionCheckpoint = {
  content: unknown;
  createdAt: string;
  endDate: null | string;
  id: string;
  note: null | string;
  planId: string;
  planName: null | string;
  setupData: unknown;
  startDate: null | string;
};

export type NutritionPlanType = 'ESTRUCTURADO' | 'LIBRE';

export type NutritionPlan = {
  checkpoints: NutritionCheckpoint[];
  clientId: null | string;
  content: unknown;
  description: null | string;
  id: string;
  name: string;
  setupData: unknown;
  sourcePlanId: null | string;
  strategy: null | string;
  type: NutritionPlanType;
};

export type MealWriteInput = {
  category: string;
  ingredients: Array<{ amountGrams: number; foodId: string; sortOrder?: number }>;
  name: string;
  notes?: null | string;
};

export type PlanWriteInput = {
  content?: unknown;
  description?: null | string;
  name: string;
  setupData?: unknown;
  strategy?: null | string;
  type: NutritionPlanType;
};

export type CheckpointWriteInput = {
  content?: unknown;
  endDate?: null | string;
  note?: null | string;
  planName?: null | string;
  setupData?: unknown;
  startDate?: null | string;
};

export type TdeeFormula = 'cunningham' | 'harris' | 'katch' | 'mifflin' | 'oms';

export type ActivityLevel = 'active' | 'light' | 'moderate' | 'sedentary' | 'very_active';

export type PlanSetupData = {
  activityLevel: ActivityLevel;
  age: number;
  bodyFatPercent?: number;
  carbsG: number;
  carbsPct: number;
  fatG: number;
  fatPct: number;
  formula: TdeeFormula;
  heightCm: number;
  proteinG: number;
  proteinPct: number;
  sex: 'female' | 'male';
  targetCalories: number;
  tdee: number;
  weightKg: number;
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
  id: string;
  label: string;
  meals: StructuredDayMeal[];
};

export type StructuredWeek = {
  days: StructuredDay[];
  id: string;
  label: string;
};

export type StructuredPlanContent = {
  weeks: StructuredWeek[];
};

export const MEAL_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack', 'other'] as const;

export const FREE_PLAN_COLUMNS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
