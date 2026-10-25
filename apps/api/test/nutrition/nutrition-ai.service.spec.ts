import { NutritionAiService, parseOpenFoodFacts } from '../../src/modules/nutrition/application/nutrition-ai.service';

function service(generateJson: jest.Mock, configured = true) {
  return new NutritionAiService({ generateJson, isConfigured: () => configured } as never);
}

describe('parseOpenFoodFacts', () => {
  it('maps per 100 g macros and names the product with its brand', () => {
    const result = parseOpenFoodFacts('8410000000001', {
      product: {
        brands: 'Marca, Otra',
        nutriments: { carbohydrates_100g: 55.4, 'energy-kcal_100g': 389.6, fat_100g: 7, proteins_100g: '12.2' },
        product_name: 'Avena',
      },
      status: 1,
    });
    expect(result).toEqual({
      barcode: '8410000000001',
      caloriesKcal: 390,
      carbsG: 55,
      fatG: 7,
      name: 'Avena · Marca',
      proteinG: 12,
    });
  });

  it('falls back to kJ when kcal is missing', () => {
    const result = parseOpenFoodFacts('8410000000002', {
      product: { nutriments: { energy_100g: 418.4 }, product_name: 'Barrita' },
      status: 1,
    });
    expect(result?.caloriesKcal).toBe(100);
  });

  it('returns null for unknown products or products without energy', () => {
    expect(parseOpenFoodFacts('1', { status: 0 })).toBeNull();
    expect(parseOpenFoodFacts('1', { product: { product_name: 'X' }, status: 1 })).toBeNull();
    expect(parseOpenFoodFacts('1', null)).toBeNull();
  });
});

describe('NutritionAiService', () => {
  const estimate = { carbsG: 80.4, confidence: 0.7, dishes: ['Arroz'], fatG: 10, kcal: 520.6, proteinG: 30 };

  it('returns a rounded estimate', async () => {
    const result = await service(jest.fn().mockResolvedValue(estimate)).estimateMeal(Buffer.from('x'), 'image/jpeg');
    expect(result).toMatchObject({ carbsG: 80, kcal: 521 });
  });

  it('returns null instead of throwing when the provider fails or answers garbage', async () => {
    expect(
      await service(jest.fn().mockRejectedValue(new Error('boom'))).estimateMeal(Buffer.from('x'), 'image/jpeg'),
    ).toBeNull();
    expect(
      await service(jest.fn().mockResolvedValue({ kcal: 'a' })).estimateMeal(Buffer.from('x'), 'image/jpeg'),
    ).toBeNull();
    expect(await service(jest.fn(), false).estimateMeal(Buffer.from('x'), 'image/jpeg')).toBeNull();
  });

  it('reads a label and rejects zero calorie reads', async () => {
    const ok = { caloriesKcal: 250, carbsG: 30, fatG: 9, name: 'Galleta', proteinG: 5 };
    expect(await service(jest.fn().mockResolvedValue(ok)).readLabel(Buffer.from('x'), 'image/png')).toMatchObject({
      barcode: null,
      name: 'Galleta',
    });
    expect(
      await service(jest.fn().mockResolvedValue({ ...ok, caloriesKcal: 0 })).readLabel(Buffer.from('x'), 'image/png'),
    ).toBeNull();
  });
});
