import {
  computeMealTotals,
  evaluateFoodConsiderations,
  evaluateMealConsiderations,
} from '../../src/modules/nutrition-considerations/domain/evaluate-considerations';
import type { NutrientProfile } from '../../src/modules/nutrition-considerations/domain/nutrition-thresholds';

const TURKEY: NutrientProfile = {
  caloriesKcal: 105,
  carbsG: 2,
  fatG: 1.5,
  fiberG: 0,
  micronutrients: [],
  proteinG: 18,
  saltG: 2.1,
  saturatedFatG: 1,
  sugarG: 2,
  unsaturatedFatG: 0.5,
};

const COOKIES: NutrientProfile = {
  caloriesKcal: 480,
  carbsG: 60,
  fatG: 22,
  fiberG: 1,
  micronutrients: [],
  proteinG: 5,
  saltG: 1.3,
  saturatedFatG: 12,
  sugarG: 24,
  unsaturatedFatG: 8,
};

const WALNUTS: NutrientProfile = {
  caloriesKcal: 650,
  carbsG: 14,
  fatG: 65,
  fiberG: 7,
  micronutrients: ['Magnesio', 'Zinc'],
  proteinG: 15,
  saltG: 0,
  saturatedFatG: 6,
  sugarG: 3,
  unsaturatedFatG: 55.25,
};

describe('evaluateFoodConsiderations', () => {
  it('ranks processed turkey as salt first, then protein and low sat/sugar', () => {
    const codes = evaluateFoodConsiderations(TURKEY, 'turkey').map((item) => item.code);
    expect(codes).toEqual(['high_salt', 'high_protein', 'low_saturated_fat', 'low_sugar']);
    expect(evaluateFoodConsiderations(TURKEY, 'turkey')[0]?.tone).toBe('bad');
  });

  it('ranks ultra-processed cookies by critical control flags', () => {
    const codes = evaluateFoodConsiderations(COOKIES, 'cookies').map((item) => item.code);
    expect(codes.slice(0, 3)).toEqual(['high_sugar', 'high_saturated_fat', 'high_salt']);
    expect(codes).toHaveLength(4);
    expect(codes[3]).toBe('empty_calories');
  });

  it('prefers composition flags for walnuts and drops calorie density', () => {
    const codes = evaluateFoodConsiderations(WALNUTS, 'walnuts').map((item) => item.code);
    expect(codes).toEqual(['micronutrients', 'high_fiber', 'healthy_fats', 'high_protein']);
    expect(codes).not.toContain('high_calories');
  });

  it('picks a stable phrase variant from the id', () => {
    const first = evaluateFoodConsiderations(TURKEY, 'stable-id');
    const second = evaluateFoodConsiderations(TURKEY, 'stable-id');
    expect(first.map((item) => item.variant)).toEqual(second.map((item) => item.variant));
  });

  it('does not fire flags for missing optional nutrients', () => {
    const codes = evaluateFoodConsiderations({ caloriesKcal: 120, fatG: 2, proteinG: 18 }, 'lean-chicken').map(
      (item) => item.code,
    );
    expect(codes).toEqual(['high_protein']);
    expect(codes).not.toContain('high_salt');
    expect(codes).not.toContain('low_sugar');
  });

  it('caps control flags at two when the diversity filter is enabled', () => {
    const codes = evaluateFoodConsiderations(COOKIES, 'cookies', { useDiversityFilter: true }).map((item) => item.code);
    const control = codes.filter((code) =>
      ['high_sugar', 'high_saturated_fat', 'high_salt', 'empty_calories', 'high_calories'].includes(code),
    );
    expect(control.length).toBeLessThanOrEqual(2);
    expect(codes.length).toBeGreaterThanOrEqual(3);
  });
});

describe('evaluateMealConsiderations', () => {
  it('flags the commercial macaroni plate by salt, sat fat, sugar, then protein', () => {
    const codes = evaluateMealConsiderations(
      {
        caloriesKcal: 680,
        carbsG: 70,
        fatG: 30,
        fiberG: 3.5,
        micronutrients: [],
        proteinG: 28,
        saltG: 2.8,
        saturatedFatG: 9.5,
        sugarG: 11,
        unsaturatedFatG: 18,
      },
      'mac-meat',
    ).map((item) => item.code);
    expect(codes).toEqual(['high_salt', 'high_saturated_fat', 'high_sugar', 'high_protein']);
  });

  it('highlights fiber, protein, clean profile and healthy fats on the homemade plate', () => {
    const codes = evaluateMealConsiderations(
      {
        caloriesKcal: 490,
        carbsG: 65,
        fatG: 11,
        fiberG: 9,
        micronutrients: [],
        proteinG: 32,
        saltG: 0.8,
        saturatedFatG: 2,
        sugarG: 4,
        unsaturatedFatG: 9,
      },
      'mac-turkey',
    ).map((item) => item.code);
    expect(codes).toEqual(['high_fiber', 'high_protein', 'low_salt_sugar', 'healthy_fats']);
  });

  it('flags caesar salad as hypercaloric, salty, saturated and fat-dominant', () => {
    const codes = evaluateMealConsiderations(
      {
        caloriesKcal: 720,
        carbsG: 35,
        fatG: 54,
        fiberG: 3,
        micronutrients: [],
        proteinG: 22,
        saltG: 3.1,
        saturatedFatG: 11,
        sugarG: 4,
        unsaturatedFatG: 30,
      },
      'caesar',
    ).map((item) => item.code);
    expect(codes).toEqual(['high_calories', 'high_salt', 'high_saturated_fat', 'dominant_fat']);
  });
});

describe('computeMealTotals', () => {
  it('scales food macros by amountGrams / 100 and unions micronutrients', () => {
    const totals = computeMealTotals([
      {
        amountGrams: 200,
        food: { caloriesKcal: 100, proteinG: 10, carbsG: 20, fatG: 5, fiberG: 3, micronutrients: ['Hierro'] },
      },
      {
        amountGrams: 50,
        food: { caloriesKcal: 200, proteinG: 0, saltG: 2, micronutrients: ['Hierro', 'Magnesio'] },
      },
    ]);
    expect(totals.caloriesKcal).toBe(300);
    expect(totals.proteinG).toBe(20);
    expect(totals.carbsG).toBe(40);
    expect(totals.fatG).toBe(10);
    expect(totals.fiberG).toBe(6);
    expect(totals.saltG).toBe(1);
    expect(totals.micronutrients).toEqual(['Hierro', 'Magnesio']);
  });
});
