import { CONSIDERATION_CATALOG, type ConsiderationMeta } from './consideration-phrases';
import {
  energyKcal,
  FOOD_THRESHOLDS as FOOD,
  isPresent,
  macroShare,
  MEAL_THRESHOLDS as MEAL,
  type NutrientProfile,
  unsaturatedRatio,
} from './nutrition-thresholds';

export type Consideration = {
  code: string;
  priority: ConsiderationMeta['priority'];
  tone: ConsiderationMeta['tone'];
  values: { x?: number };
  variant: number;
};

export type EvaluateOptions = {
  useDiversityFilter?: boolean;
};

export type MealIngredientNutrients = {
  amountGrams: number;
  food: NutrientProfile;
};

const FOOD_ORDER = [
  'high_sugar',
  'high_saturated_fat',
  'high_salt',
  'micronutrients',
  'high_fiber',
  'healthy_fats',
  'high_protein',
  'low_saturated_fat',
  'low_sugar',
  'low_salt_sugar',
  'empty_calories',
  'high_calories',
  'low_calories',
  'high_carbs',
  'low_protein',
  'low_carbs',
];

const MEAL_ORDER = [
  'high_calories',
  'high_salt',
  'high_saturated_fat',
  'high_sugar',
  'balanced_plate',
  'high_fiber',
  'high_carbs',
  'dominant_fat',
  'high_protein',
  'low_salt_sugar',
  'low_calories',
  'vegetables',
  'healthy_fats',
];

export function evaluateFoodConsiderations(
  profile: NutrientProfile,
  id: string,
  options: EvaluateOptions = {},
): Consideration[] {
  return finalize(detectFoodFlags(profile), id, options.useDiversityFilter === true, profile);
}

export function evaluateMealConsiderations(
  profile: NutrientProfile,
  id: string,
  options: EvaluateOptions = {},
): Consideration[] {
  return finalize(detectMealFlags(profile), id, options.useDiversityFilter === true, profile);
}

export function computeMealTotals(ingredients: MealIngredientNutrients[]): NutrientProfile {
  const totals: Required<Pick<NutrientProfile, 'micronutrients'>> & NutrientProfile = {
    micronutrients: [],
  };
  const micros = new Set<string>();
  for (const item of ingredients) {
    const factor = item.amountGrams / 100;
    addScaled(totals, item.food, factor);
    for (const tag of item.food.micronutrients ?? []) {
      if (tag.trim()) {
        micros.add(tag.trim());
      }
    }
  }
  totals.micronutrients = [...micros];
  return totals;
}

function detectFoodFlags(profile: NutrientProfile): ConsiderationMeta[] {
  const flags: ConsiderationMeta[] = [];
  const healthy = isHealthyFats(profile, FOOD.healthyFatG, FOOD.unsaturatedRatio);
  pushFlag(flags, 'high_sugar', isPresent(profile.sugarG) && profile.sugarG > FOOD.highSugarG);
  pushFlag(flags, 'high_saturated_fat', isHighSat(profile, FOOD.highSaturatedFatG) && !healthy);
  pushFlag(flags, 'high_salt', isPresent(profile.saltG) && profile.saltG > FOOD.highSaltG);
  pushFlag(flags, 'micronutrients', (profile.micronutrients ?? []).length >= FOOD.micronutrientCount);
  pushFlag(flags, 'high_fiber', isPresent(profile.fiberG) && profile.fiberG >= FOOD.highFiberG);
  pushFlag(flags, 'healthy_fats', healthy);
  pushFlag(flags, 'high_protein', isHighProteinFood(profile));
  pushFlag(flags, 'low_saturated_fat', isPresent(profile.saturatedFatG) && profile.saturatedFatG < FOOD.lowSaturatedFatG);
  pushFlag(flags, 'low_sugar', isPresent(profile.sugarG) && profile.sugarG < FOOD.lowSugarG);
  pushFlag(flags, 'low_salt_sugar', isCleanSaltSugar(profile, FOOD.lowSaltG, FOOD.lowSugarG));
  pushFlag(flags, 'empty_calories', isEmptyCalories(profile));
  pushFlag(flags, 'high_calories', isPresent(profile.caloriesKcal) && profile.caloriesKcal > FOOD.highCaloriesKcal);
  pushFlag(flags, 'low_calories', isPresent(profile.caloriesKcal) && profile.caloriesKcal < FOOD.lowCaloriesKcal);
  pushFlag(flags, 'high_carbs', isPresent(profile.carbsG) && profile.carbsG > FOOD.highCarbsG);
  pushFlag(flags, 'low_protein', isPresent(profile.proteinG) && profile.proteinG < FOOD.lowProteinG);
  pushFlag(flags, 'low_carbs', isPresent(profile.carbsG) && profile.carbsG < FOOD.lowCarbsG);
  return orderFlags(flags, FOOD_ORDER);
}

function detectMealFlags(profile: NutrientProfile): ConsiderationMeta[] {
  const flags: ConsiderationMeta[] = [];
  const vet = energyKcal(profile);
  const healthy = isHealthyFats(profile, MEAL.healthyFatG, MEAL.unsaturatedRatio);
  pushFlag(flags, 'high_calories', isPresent(profile.caloriesKcal) && profile.caloriesKcal > MEAL.highCaloriesKcal, {
    priority: 'P1',
    tone: 'bad',
  });
  pushFlag(flags, 'high_salt', isPresent(profile.saltG) && profile.saltG > MEAL.highSaltG);
  pushFlag(flags, 'high_saturated_fat', isHighSat(profile, MEAL.highSaturatedFatG) && !healthy);
  pushFlag(flags, 'high_sugar', isPresent(profile.sugarG) && profile.sugarG > MEAL.highSugarG);
  pushFlag(flags, 'balanced_plate', isBalancedPlate(profile, vet));
  pushFlag(flags, 'high_fiber', isPresent(profile.fiberG) && profile.fiberG >= MEAL.highFiberG);
  pushFlag(flags, 'high_carbs', (macroShare(profile.carbsG, 4, vet) ?? 0) > MEAL.dominantCarbs, {
    priority: 'P2',
  });
  pushFlag(flags, 'dominant_fat', (macroShare(profile.fatG, 9, vet) ?? 0) > MEAL.dominantFat);
  pushFlag(flags, 'high_protein', isPresent(profile.proteinG) && profile.proteinG >= MEAL.highProteinG);
  pushFlag(flags, 'low_salt_sugar', isCleanSaltSugar(profile, MEAL.highSaltG, MEAL.highSugarG));
  pushFlag(flags, 'low_calories', isPresent(profile.caloriesKcal) && profile.caloriesKcal < MEAL.lowCaloriesKcal, {
    priority: 'P3',
    tone: 'good',
  });
  pushFlag(flags, 'vegetables', (profile.micronutrients ?? []).length >= 2);
  pushFlag(flags, 'healthy_fats', healthy, { priority: 'P4' });
  return orderFlags(flags, MEAL_ORDER);
}

function finalize(flags: ConsiderationMeta[], id: string, useDiversity: boolean, profile: NutrientProfile): Consideration[] {
  const selected = useDiversity ? applyDiversity(flags) : flags.slice(0, 4);
  return selected.map((flag) => ({
    code: flag.code,
    priority: flag.priority,
    tone: flag.tone,
    values: displayValue(flag.code, profile),
    variant: pickVariant(id + flag.code, flag.variants),
  }));
}

function applyDiversity(flags: ConsiderationMeta[]): ConsiderationMeta[] {
  const control = flags.filter((flag) => flag.block === 'CONTROL').slice(0, 2);
  const composition = flags.filter((flag) => flag.block === 'COMPOSITION');
  const selected = [...control];
  for (const flag of composition) {
    if (selected.length >= 4) {
      break;
    }
    selected.push(flag);
  }
  return selected.slice(0, 4);
}

function pushFlag(
  flags: ConsiderationMeta[],
  code: string,
  active: boolean,
  override: Partial<ConsiderationMeta> = {},
): void {
  const base = CONSIDERATION_CATALOG[code];
  if (!active || !base) {
    return;
  }
  flags.push({ ...base, ...override, code: base.code });
}

function orderFlags(flags: ConsiderationMeta[], order: string[]): ConsiderationMeta[] {
  const rank: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };
  return [...flags].sort((left, right) => {
    const byPriority = (rank[left.priority] ?? 4) - (rank[right.priority] ?? 4);
    if (byPriority !== 0) {
      return byPriority;
    }
    return order.indexOf(left.code) - order.indexOf(right.code);
  });
}

function isHighProteinFood(profile: NutrientProfile): boolean {
  if (isPresent(profile.proteinG) && profile.proteinG >= FOOD.highProteinG) {
    return true;
  }
  const vet = energyKcal(profile);
  const share = macroShare(profile.proteinG, 4, vet);
  return share != null && share >= FOOD.highProteinVet;
}

function isHighSat(profile: NutrientProfile, threshold: number): boolean {
  return isPresent(profile.saturatedFatG) && profile.saturatedFatG > threshold;
}

function isHealthyFats(profile: NutrientProfile, minFatG: number, ratio: number): boolean {
  if (!isPresent(profile.fatG) || profile.fatG <= minFatG) {
    return false;
  }
  const unsaturated = unsaturatedRatio(profile);
  return unsaturated != null && unsaturated > ratio;
}

function isCleanSaltSugar(profile: NutrientProfile, saltMax: number, sugarMax: number): boolean {
  return isPresent(profile.saltG) && profile.saltG < saltMax && isPresent(profile.sugarG) && profile.sugarG < sugarMax;
}

function isEmptyCalories(profile: NutrientProfile): boolean {
  if (!isPresent(profile.caloriesKcal) || profile.caloriesKcal <= FOOD.emptyCaloriesKcal) {
    return false;
  }
  const proteinLow = !isPresent(profile.proteinG) || profile.proteinG < FOOD.lowProteinEmptyG;
  const fiberLow = !isPresent(profile.fiberG) || profile.fiberG < FOOD.lowFiberG;
  const microsLow = (profile.micronutrients ?? []).length < FOOD.micronutrientCount;
  return proteinLow && fiberLow && microsLow;
}

function isBalancedPlate(profile: NutrientProfile, vet: number): boolean {
  const carbs = macroShare(profile.carbsG, 4, vet);
  const protein = macroShare(profile.proteinG, 4, vet);
  const fat = macroShare(profile.fatG, 9, vet);
  if (carbs == null || protein == null || fat == null) {
    return false;
  }
  return (
    carbs >= MEAL.balancedCarbsMin &&
    carbs <= MEAL.balancedCarbsMax &&
    protein >= MEAL.balancedProteinMin &&
    protein <= MEAL.balancedProteinMax &&
    fat >= MEAL.balancedFatMin &&
    fat <= MEAL.balancedFatMax
  );
}

function addScaled(totals: NutrientProfile, food: NutrientProfile, factor: number): void {
  totals.caloriesKcal = addNullable(totals.caloriesKcal, food.caloriesKcal, factor);
  totals.proteinG = addNullable(totals.proteinG, food.proteinG, factor);
  totals.carbsG = addNullable(totals.carbsG, food.carbsG, factor);
  totals.fatG = addNullable(totals.fatG, food.fatG, factor);
  totals.fiberG = addNullable(totals.fiberG, food.fiberG, factor);
  totals.sugarG = addNullable(totals.sugarG, food.sugarG, factor);
  totals.saturatedFatG = addNullable(totals.saturatedFatG, food.saturatedFatG, factor);
  totals.saltG = addNullable(totals.saltG, food.saltG, factor);
  totals.unsaturatedFatG = addNullable(totals.unsaturatedFatG, food.unsaturatedFatG, factor);
}

function addNullable(current: null | number | undefined, value: null | number | undefined, factor: number): number | null {
  if (!isPresent(value)) {
    return current ?? null;
  }
  return (current ?? 0) + value * factor;
}

function displayValue(code: string, profile: NutrientProfile): { x?: number } {
  const rounded = (value: null | number | undefined): { x?: number } =>
    isPresent(value) ? { x: roundNutrient(value) } : {};
  if (code === 'high_protein' || code === 'low_protein') {
    return rounded(profile.proteinG);
  }
  if (code === 'high_fiber') {
    return rounded(profile.fiberG);
  }
  if (code === 'high_salt' || code === 'low_salt_sugar') {
    return rounded(profile.saltG);
  }
  if (code === 'high_sugar' || code === 'low_sugar') {
    return rounded(profile.sugarG);
  }
  if (code === 'high_saturated_fat' || code === 'low_saturated_fat') {
    return rounded(profile.saturatedFatG);
  }
  if (code === 'high_calories' || code === 'low_calories' || code === 'empty_calories') {
    return rounded(profile.caloriesKcal);
  }
  if (code === 'high_carbs' || code === 'low_carbs') {
    return rounded(profile.carbsG);
  }
  return {};
}

function roundNutrient(value: number): number {
  return Math.round(value * 10) / 10;
}

function pickVariant(seed: string, variants: number): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % Math.max(variants, 1);
}
