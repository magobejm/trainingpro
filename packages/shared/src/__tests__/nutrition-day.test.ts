import { buildDayMacros, compareToTarget, resolvePlanDay } from '../client-plan/nutrition-day';

const monday = new Date(2026, 9, 19);
const nextMonday = new Date(2026, 10, 2);
const saturday = new Date(2026, 9, 24);

function structuredPlan(dayCount: number) {
  return {
    assignedAt: monday.toISOString(),
    content: {
      weeks: [
        { days: days('A', dayCount), id: 'w1', label: 'Semana 1' },
        { days: days('B', 7), id: 'w2', label: 'Semana 2' },
      ],
    },
    type: 'ESTRUCTURADO' as const,
  };
}

function days(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    label: `Día ${index + 1}`,
    meals: [{ id: `${prefix}-meal-${index}`, mealId: 'meal-1', name: `${prefix} comida` }],
  }));
}

describe('resolvePlanDay', () => {
  it('uses week one on the assignment monday and week two two weeks later', () => {
    expect(resolvePlanDay(structuredPlan(7), monday, monday).weekLabel).toBe('Semana 1');
    expect(resolvePlanDay(structuredPlan(7), monday, nextMonday).weekLabel).toBe('Semana 1');
    expect(resolvePlanDay(structuredPlan(7), monday, new Date(2026, 9, 26)).weekLabel).toBe('Semana 2');
  });

  it('returns to week one after the last week', () => {
    expect(resolvePlanDay(structuredPlan(7), monday, new Date(2026, 10, 2)).weekIndex).toBe(0);
  });

  it('is empty when the week has no meal for that weekday', () => {
    const day = resolvePlanDay(structuredPlan(5), monday, saturday);
    expect(day.empty).toBe(true);
    expect(day.meals).toEqual([]);
  });

  it('keeps the free plan on every day', () => {
    const plan = {
      content: { columns: { breakfast: [{ foodId: 'oats', foodName: 'Avena', id: '1', type: 'food', amountGrams: 80 }] } },
      type: 'LIBRE' as const,
    };
    expect(resolvePlanDay(plan, monday, saturday).meals[0]?.key).toBe('breakfast');
    expect(resolvePlanDay(plan, monday, nextMonday).meals[0]?.items[0]?.name).toBe('Avena');
  });
});

describe('buildDayMacros', () => {
  const foods = [
    { caloriesKcal: 100, carbsG: 10, fatG: 2, id: 'rice', proteinG: 3, servingUnit: '100g' },
    { caloriesKcal: 150, carbsG: 0, fatG: 8, id: 'egg', proteinG: 12, servingUnit: 'porcion' },
  ];

  it('scales 100g foods and portions', () => {
    const day = resolvePlanDay(
      {
        content: {
          columns: {
            lunch: [
              { amountGrams: 200, foodId: 'rice', foodName: 'Arroz', id: 'a', type: 'food' },
              { amountGrams: 2, foodId: 'egg', foodName: 'Huevo', id: 'b', type: 'food' },
            ],
          },
        },
        type: 'LIBRE',
      },
      monday,
      monday,
    );
    const macros = buildDayMacros(day, [], foods);
    expect(macros.total.caloriesKcal).toBe(500);
    expect(macros.total.proteinG).toBe(30);
  });

  it('expands a referenced meal', () => {
    const day = resolvePlanDay(structuredPlan(7), monday, monday);
    const macros = buildDayMacros(
      day,
      [
        {
          id: 'meal-1',
          ingredients: [{ amountGrams: 100, food: { ...foods[0]!, name: 'rice' }, foodId: 'rice' }],
          name: 'Bol',
        },
      ],
      foods,
    );
    expect(macros.meals[0]?.totals.caloriesKcal).toBe(100);
    expect(macros.meals[0]?.items[0]?.name).toBe('rice');
  });
});

describe('compareToTarget', () => {
  it('returns the percent of each target', () => {
    const [calories, protein] = compareToTarget(
      { caloriesKcal: 1500, carbsG: 100, fatG: 40, proteinG: 75 },
      { targetCalories: 2000, proteinG: 150 },
    );
    expect(calories?.percent).toBe(75);
    expect(protein?.percent).toBe(50);
    expect(compareToTarget({ caloriesKcal: 1, carbsG: 1, fatG: 1, proteinG: 1 }, null)[2]?.percent).toBeNull();
  });
});
