import type { ActivityLevel, PlanSetupData, TdeeFormula } from './nutrition.types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  active: 1.725,
  light: 1.375,
  moderate: 1.55,
  sedentary: 1.2,
  very_active: 1.9,
};

export function calculateBmr(input: {
  age: number;
  bodyFatPercent?: number;
  formula: TdeeFormula;
  heightCm: number;
  sex: 'female' | 'male';
  weightKg: number;
}): number {
  const { age, heightCm, sex, weightKg, formula, bodyFatPercent } = input;
  if (formula === 'mifflin') {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return sex === 'male' ? base + 5 : base - 161;
  }
  if (formula === 'harris') {
    if (sex === 'male') {
      return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
    }
    return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
  }
  const leanMass = weightKg * (1 - (bodyFatPercent ?? 20) / 100);
  if (formula === 'katch') {
    return 370 + 21.6 * leanMass;
  }
  if (formula === 'cunningham') {
    return 500 + 22 * leanMass;
  }
  // OMS / WHO simplified
  if (sex === 'male') {
    if (age < 30) return 15.3 * weightKg + 679;
    if (age < 60) return 11.6 * weightKg + 879;
    return 13.5 * weightKg + 487;
  }
  if (age < 30) return 14.7 * weightKg + 496;
  if (age < 60) return 8.7 * weightKg + 829;
  return 10.5 * weightKg + 596;
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateMacros(
  targetCalories: number,
  proteinPct: number,
  carbsPct: number,
  fatPct: number,
): { carbsG: number; fatG: number; proteinG: number } {
  const total = proteinPct + carbsPct + fatPct;
  const scale = total > 0 ? 100 / total : 1;
  const proteinG = Math.round((targetCalories * (proteinPct * scale)) / 100 / 4);
  const carbsG = Math.round((targetCalories * (carbsPct * scale)) / 100 / 4);
  const fatG = Math.round((targetCalories * (fatPct * scale)) / 100 / 9);
  return { carbsG, fatG, proteinG };
}

export function buildPlanSetupData(input: {
  activityLevel: ActivityLevel;
  age: number;
  bodyFatPercent?: number;
  carbsPct: number;
  fatPct: number;
  formula: TdeeFormula;
  heightCm: number;
  proteinPct: number;
  sex: 'female' | 'male';
  targetCalories?: number;
  weightKg: number;
}): PlanSetupData {
  const bmr = calculateBmr(input);
  const tdee = calculateTdee(bmr, input.activityLevel);
  const targetCalories = input.targetCalories ?? tdee;
  const macros = calculateMacros(targetCalories, input.proteinPct, input.carbsPct, input.fatPct);
  return {
    activityLevel: input.activityLevel,
    age: input.age,
    bodyFatPercent: input.bodyFatPercent,
    carbsG: macros.carbsG,
    carbsPct: input.carbsPct,
    fatG: macros.fatG,
    fatPct: input.fatPct,
    formula: input.formula,
    heightCm: input.heightCm,
    proteinG: macros.proteinG,
    proteinPct: input.proteinPct,
    sex: input.sex,
    targetCalories,
    tdee,
    weightKg: input.weightKg,
  };
}

export function readSetupData(value: unknown): PlanSetupData | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Partial<PlanSetupData>;
  if (typeof data.targetCalories !== 'number') return null;
  return data as PlanSetupData;
}
