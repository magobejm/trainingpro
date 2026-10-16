import {
  readStructuredContent,
  readFreeContent,
  mealTotals,
  nutritionPlanPayload,
  duplicateNutritionResource,
  nutritionDraftKey,
} from '../coach-nutrition-model';
import { buildPlanSetupData, calculateBmr } from '@trainerpro/shared';
describe('mobile nutrition parity', () => {
  it('isolates copy drafts by source, resource kind and client context', () => {
    const copyA = duplicateNutritionResource({ id: 'plan-a', name: 'Plan A' }, 'Copy');
    const copyB = duplicateNutritionResource({ id: 'plan-b', name: 'Plan B' }, 'Copy');
    expect(copyA).toEqual({ id: '', draftSourceId: 'plan-a', name: 'Plan A · Copy' });
    expect(nutritionDraftKey('plan', copyA, 'client-a')).not.toBe(nutritionDraftKey('plan', copyB, 'client-a'));
    expect(nutritionDraftKey('plan', copyA, 'client-a')).not.toBe(nutritionDraftKey('plan', copyA, 'client-b'));
    expect(nutritionDraftKey('plan', copyA)).not.toBe(nutritionDraftKey('meal', copyA));
    expect(nutritionDraftKey('meal', copyA)).not.toBe(nutritionDraftKey('meal'));
  });
  it('retains unknown content fields and custom free columns during edits', () => {
    expect(readStructuredContent({ version: 3, weeks: [{ id: 'w', label: 'W', days: [], custom: true }] })).toMatchObject({
      version: 3,
      weeks: [{ custom: true }],
    });
    expect(readFreeContent({ custom: 7, columns: { custom: [{ id: 'a' }] } })).toMatchObject({
      custom: 7,
      columns: { custom: [{ id: 'a' }] },
    });
  });
  it('uses per100 quantities and shares web calorie/macros calculations', () => {
    expect(
      mealTotals([{ amountGrams: 150, foodId: 'f' }], [{ id: 'f', caloriesKcal: 100, proteinG: 20, carbsG: 5, fatG: 2 }]),
    ).toEqual({ caloriesKcal: 150, proteinG: 30, carbsG: 7.5, fatG: 3 });
    expect(calculateBmr({ formula: 'mifflin', age: 30, heightCm: 180, weightKg: 80, sex: 'male' })).toBe(1780);
    expect(
      buildPlanSetupData({
        formula: 'mifflin',
        activityLevel: 'sedentary',
        age: 30,
        heightCm: 180,
        weightKg: 80,
        sex: 'male',
        proteinPct: 30,
        carbsPct: 40,
        fatPct: 30,
      }).targetCalories,
    ).toBe(2136);
  });
  it('preserves full payload while stripping server identifiers', () => {
    expect(
      nutritionPlanPayload({
        id: 'p',
        name: ' Name ',
        type: 'LIBRE',
        clientId: 'c',
        content: { columns: {}, extension: 8 },
        setupData: { custom: 1 },
        strategy: 'x',
        description: 'y',
      }),
    ).toEqual({
      name: 'Name',
      type: 'LIBRE',
      content: { columns: {}, extension: 8 },
      setupData: { custom: 1 },
      strategy: 'x',
      description: 'y',
    });
  });
});
