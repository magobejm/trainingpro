export type NutrientProfile = {
  caloriesKcal?: null | number;
  carbsG?: null | number;
  fatG?: null | number;
  fiberG?: null | number;
  micronutrients?: string[];
  proteinG?: null | number;
  saltG?: null | number;
  saturatedFatG?: null | number;
  sugarG?: null | number;
  unsaturatedFatG?: null | number;
};

export const FOOD_THRESHOLDS = {
  emptyCaloriesKcal: 250,
  healthyFatG: 10,
  highCaloriesKcal: 400,
  highCarbsG: 30,
  highFiberG: 6,
  highProteinG: 15,
  highProteinVet: 0.2,
  highSaltG: 1.25,
  highSaturatedFatG: 5,
  highSugarG: 12.5,
  lowCaloriesKcal: 40,
  lowCarbsG: 5,
  lowFiberG: 3,
  lowProteinG: 5,
  lowProteinEmptyG: 10,
  lowSaltG: 0.3,
  lowSaturatedFatG: 1.5,
  lowSugarG: 5,
  micronutrientCount: 2,
  unsaturatedRatio: 0.7,
} as const;

export const MEAL_THRESHOLDS = {
  balancedCarbsMax: 0.55,
  balancedCarbsMin: 0.45,
  balancedFatMax: 0.35,
  balancedFatMin: 0.25,
  balancedProteinMax: 0.3,
  balancedProteinMin: 0.2,
  dominantCarbs: 0.6,
  dominantFat: 0.45,
  dominantProtein: 0.35,
  healthyFatG: 10,
  highCaloriesKcal: 700,
  highFiberG: 8,
  highProteinG: 25,
  highSaltG: 2.5,
  highSaturatedFatG: 8,
  highSugarG: 10,
  lowCaloriesKcal: 350,
  unsaturatedRatio: 0.7,
} as const;

export function isPresent(value: null | number | undefined): value is number {
  return value != null && Number.isFinite(value);
}

export function energyKcal(profile: NutrientProfile): number {
  if (isPresent(profile.caloriesKcal) && profile.caloriesKcal > 0) {
    return profile.caloriesKcal;
  }
  const protein = isPresent(profile.proteinG) ? profile.proteinG * 4 : 0;
  const carbs = isPresent(profile.carbsG) ? profile.carbsG * 4 : 0;
  const fat = isPresent(profile.fatG) ? profile.fatG * 9 : 0;
  return protein + carbs + fat;
}

export function macroShare(grams: null | number | undefined, kcalPerGram: number, totalKcal: number): number | null {
  if (!isPresent(grams) || totalKcal <= 0) {
    return null;
  }
  return (grams * kcalPerGram) / totalKcal;
}

export function unsaturatedRatio(profile: NutrientProfile): number | null {
  if (!isPresent(profile.fatG) || profile.fatG <= 0 || !isPresent(profile.unsaturatedFatG)) {
    return null;
  }
  return profile.unsaturatedFatG / profile.fatG;
}
