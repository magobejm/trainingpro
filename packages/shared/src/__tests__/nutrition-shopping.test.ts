import { buildShoppingList, rankSubstitutes } from '../client-plan/nutrition-shopping';

describe('buildShoppingList', () => {
  const foods = [
    { foodCategory: 'cereal', id: 'rice', name: 'Arroz', servingUnit: '100g' },
    { foodCategory: 'protein', id: 'egg', name: 'Huevo', servingUnit: 'porcion' },
  ];

  it('multiplies a free plan by the seven days of the week', () => {
    const plan = {
      content: {
        columns: { lunch: [{ amountGrams: 100, foodId: 'rice', foodName: 'Arroz', id: 'a', type: 'food' as const }] },
      },
      type: 'LIBRE' as const,
    };
    const groups = buildShoppingList(plan, '2026-10-19T00:00:00.000Z', new Date(2026, 9, 23), [], foods);
    expect(groups).toEqual([
      {
        category: 'cereal',
        items: [{ category: 'cereal', foodId: 'rice', grams: 700, name: 'Arroz', servingUnit: '100g' }],
      },
    ]);
  });

  it('keeps a single day when the range is the day', () => {
    const plan = {
      content: {
        columns: { lunch: [{ amountGrams: 100, foodId: 'rice', foodName: 'Arroz', id: 'a', type: 'food' as const }] },
      },
      type: 'LIBRE' as const,
    };
    const groups = buildShoppingList(plan, '2026-10-19T00:00:00.000Z', new Date(2026, 9, 23), [], foods, 'day');
    expect(groups[0]?.items[0]?.grams).toBe(100);
  });

  it('sums only the days present in the current structured week', () => {
    const plan = {
      content: {
        weeks: [
          {
            days: [{ id: 'mon', label: 'Lunes', meals: [{ id: 'm1', mealId: 'meal', name: 'Comida' }] }],
            id: 'w1',
            label: 'Semana 1',
          },
        ],
      },
      type: 'ESTRUCTURADO' as const,
    };
    const meals = [{ id: 'meal', ingredients: [{ amountGrams: 2, food: foods[1]!, foodId: 'egg' }], name: 'Comida' }];
    const groups = buildShoppingList(plan, new Date(2026, 9, 19), new Date(2026, 9, 23), meals, []);
    expect(groups[0]?.items[0]).toEqual({
      category: 'protein',
      foodId: 'egg',
      grams: 2,
      name: 'Huevo',
      servingUnit: 'porcion',
    });
  });
});

describe('rankSubstitutes', () => {
  it('scales candidates to the same calories and keeps the closest five', () => {
    const source = { caloriesKcal: 100, carbsG: 10, fatG: 2, id: 'rice', proteinG: 3, servingUnit: '100g' };
    const options = rankSubstitutes(source, 200, [
      { caloriesKcal: 50, carbsG: 1, fatG: 8, id: 'oil', name: 'Aceite', proteinG: 0, servingUnit: '100g' },
      { caloriesKcal: 100, carbsG: 12, fatG: 1, id: 'pasta', name: 'Pasta', proteinG: 4, servingUnit: '100g' },
    ]);
    expect(options[0]).toEqual({ foodId: 'pasta', grams: 200, name: 'Pasta', servingUnit: '100g' });
    expect(options).toHaveLength(2);
  });
});
