import { describe, expect, it, vi } from 'vitest';
import { buildNutritionCrumbs } from './nutrition-crumbs';

const t = (key: string): string => key;

function input(view: Parameters<typeof buildNutritionCrumbs>[0]['view'], clientId = '') {
  return {
    clientId,
    clientName: 'Ana López',
    foodName: 'Avena',
    mealName: 'Desayuno',
    onHub: vi.fn(),
    onMeals: vi.fn(),
    onPlans: vi.fn(),
    planName: 'Volumen',
    t,
    view,
  };
}

describe('buildNutritionCrumbs', () => {
  it('trails meals and plans from the nutrition module', () => {
    expect(buildNutritionCrumbs(input('createMeal')).map((crumb) => crumb.label)).toEqual([
      'coach.nutrition.title',
      'coach.nutrition.meals.title',
      'coach.nutrition.meals.create',
    ]);
    expect(buildNutritionCrumbs(input('createPlan')).at(-1)?.to).toBeNull();
    expect(buildNutritionCrumbs(input('wizard'))[1]?.onPress).toEqual(expect.any(Function));
  });

  it('keeps the client trail when a plan is created from the profile', () => {
    const crumbs = buildNutritionCrumbs(input('buildFree', 'abc'));
    expect(crumbs.map((crumb) => [crumb.label, crumb.to])).toEqual([
      ['coach.clients.title', '/coach/clients'],
      ['Ana López', '/coach/clients/abc'],
      ['coach.nutrition.client.title', '/coach/clients/abc/nutrition'],
      ['coach.nutrition.plans.title', null],
      ['Volumen', null],
    ]);
    expect(crumbs[3]?.onPress).toEqual(expect.any(Function));
  });
});
