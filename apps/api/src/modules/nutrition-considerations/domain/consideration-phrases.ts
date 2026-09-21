export type ConsiderationBlock = 'COMPOSITION' | 'CONTROL';
export type ConsiderationPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type ConsiderationTone = 'bad' | 'good' | 'neutral';

export type ConsiderationMeta = {
  block: ConsiderationBlock;
  code: string;
  priority: ConsiderationPriority;
  tone: ConsiderationTone;
  variants: number;
};

export const CONSIDERATION_CATALOG: Record<string, ConsiderationMeta> = {
  balanced_plate: meta('balanced_plate', 'P2', 'COMPOSITION', 'good', 3),
  dominant_fat: meta('dominant_fat', 'P2', 'CONTROL', 'bad', 3),
  empty_calories: meta('empty_calories', 'P3', 'CONTROL', 'bad', 3),
  healthy_fats: meta('healthy_fats', 'P2', 'COMPOSITION', 'good', 3),
  high_calories: meta('high_calories', 'P4', 'CONTROL', 'neutral', 3),
  high_carbs: meta('high_carbs', 'P4', 'COMPOSITION', 'neutral', 3),
  high_fiber: meta('high_fiber', 'P2', 'COMPOSITION', 'good', 3),
  high_protein: meta('high_protein', 'P3', 'COMPOSITION', 'good', 3),
  high_salt: meta('high_salt', 'P1', 'CONTROL', 'bad', 3),
  high_saturated_fat: meta('high_saturated_fat', 'P1', 'CONTROL', 'bad', 3),
  high_sugar: meta('high_sugar', 'P1', 'CONTROL', 'bad', 3),
  low_calories: meta('low_calories', 'P4', 'COMPOSITION', 'good', 3),
  low_carbs: meta('low_carbs', 'P4', 'COMPOSITION', 'neutral', 3),
  low_protein: meta('low_protein', 'P4', 'COMPOSITION', 'neutral', 3),
  low_salt_sugar: meta('low_salt_sugar', 'P3', 'COMPOSITION', 'good', 3),
  low_saturated_fat: meta('low_saturated_fat', 'P3', 'COMPOSITION', 'good', 3),
  low_sugar: meta('low_sugar', 'P3', 'COMPOSITION', 'good', 3),
  micronutrients: meta('micronutrients', 'P2', 'COMPOSITION', 'good', 3),
  vegetables: meta('vegetables', 'P4', 'COMPOSITION', 'good', 3),
};

function meta(
  code: string,
  priority: ConsiderationPriority,
  block: ConsiderationBlock,
  tone: ConsiderationTone,
  variants: number,
): ConsiderationMeta {
  return { block, code, priority, tone, variants };
}
