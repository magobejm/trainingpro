import type {
  CoachFreePlanContent as FreePlanContent,
  CoachStructuredPlanContent as StructuredPlanContent,
  CoachNutritionPlan as NutritionPlan,
  CoachNutritionMeal as NutritionMeal,
  CoachPlanWriteInput as PlanWriteInput,
} from '@trainerpro/shared';
export type NutritionDraftOrigin = { draftSourceId?: string };
export function duplicateNutritionResource<T extends { id: string; name: string }>(
  resource: T,
  copyLabel: string,
): T & NutritionDraftOrigin {
  return { ...resource, id: '', draftSourceId: resource.id, name: resource.name + ' · ' + copyLabel };
}
export function nutritionDraftKey(
  kind: 'plan' | 'meal',
  resource?: { id: string } & NutritionDraftOrigin,
  clientId?: string,
): string {
  const identity = resource?.id || (resource?.draftSourceId ? 'copyof:' + resource.draftSourceId : 'new');
  return 'nutrition-' + kind + ':' + identity + ':' + (clientId ?? 'library');
}
export type NutritionFood = {
  id: string;
  name: string;
  servingUnit?: string | null;
  caloriesKcal?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  [key: string]: unknown;
};
const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
export function readStructuredContent(value: unknown): StructuredPlanContent & Record<string, unknown> {
  const source = record(value);
  return { ...source, weeks: Array.isArray(source.weeks) ? source.weeks : [] } as StructuredPlanContent &
    Record<string, unknown>;
}
export function readFreeContent(value: unknown): FreePlanContent & Record<string, unknown> {
  const source = record(value);
  return {
    ...source,
    columns: { breakfast: [], lunch: [], dinner: [], snack: [], ...record(source.columns) },
  } as FreePlanContent & Record<string, unknown>;
}
export function mealTotals(
  ingredients: { foodId: string; amountGrams: number }[],
  foods: Array<{
    id: string;
    caloriesKcal?: number | null;
    proteinG?: number | null;
    carbsG?: number | null;
    fatG?: number | null;
  }>,
) {
  return ingredients.reduce(
    (totals, item) => {
      const food = foods.find((f) => f.id === item.foodId);
      for (const key of ['caloriesKcal', 'proteinG', 'carbsG', 'fatG'] as const)
        totals[key] += ((food?.[key] ?? 0) * item.amountGrams) / 100;
      return totals;
    },
    { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}
export function nutritionPlanPayload(plan: PlanWriteInput | NutritionPlan): PlanWriteInput {
  return {
    name: plan.name.trim(),
    type: plan.type,
    content: plan.content,
    setupData: plan.setupData,
    description: plan.description ?? null,
    strategy: plan.strategy ?? null,
  };
}
export function nutritionVersion(value: unknown): string {
  return JSON.stringify(value);
}
export function nutritionId(prefix: string): string {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}
export function nutritionDocument(plan: PlanWriteInput, meals: NutritionMeal[]): { title: string; lines: string[] }[] {
  const result = [{ title: plan.name, lines: [plan.description ?? '', plan.strategy ?? ''].filter(Boolean) }];
  if (plan.type === 'ESTRUCTURADO') {
    for (const week of readStructuredContent(plan.content).weeks)
      for (const day of week.days)
        result.push({
          title: week.label + ' · ' + day.label,
          lines: day.meals.flatMap((item) => {
            const meal = meals.find((m) => m.id === item.mealId);
            return [
              item.name + (item.time ? ' · ' + item.time : ''),
              ...(meal?.ingredients.map((i) => i.food.name + ' · ' + i.amountGrams + ' g') ?? []),
            ];
          }),
        });
  } else
    for (const [column, items] of Object.entries(readFreeContent(plan.content).columns))
      result.push({
        title: column,
        lines: items.map(
          (item) => (item.foodName ?? item.mealName ?? '') + (item.amountGrams ? ' · ' + item.amountGrams + ' g' : ''),
        ),
      });
  return result;
}
