import type { FoodLibraryItem } from '../../domain/entities/food-library-item';
import { evaluateFoodConsiderations } from '../../../nutrition-considerations/domain/evaluate-considerations';

export function toOutput(item: Record<string, unknown>) {
  const createdAt = item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt;
  const updatedAt = item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt;
  return {
    ...item,
    createdAt,
    updatedAt,
  };
}

export function toFoodOutput(item: FoodLibraryItem) {
  return {
    ...toOutput(item as unknown as Record<string, unknown>),
    considerations: evaluateFoodConsiderations(
      {
        caloriesKcal: item.caloriesKcal,
        carbsG: item.carbsG,
        fatG: item.fatG,
        fiberG: item.fiberG,
        micronutrients: item.micronutrients,
        proteinG: item.proteinG,
        saltG: item.saltG,
        saturatedFatG: item.saturatedFatG,
        sugarG: item.sugarG,
        unsaturatedFatG: item.unsaturatedFatG,
      },
      item.id,
    ),
  };
}
