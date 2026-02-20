import { normalizeNullable, parseOptionalNumber } from './libraryCreateForm.utils';

export const UNIT_FILTER_KEYS = ['all', '100g', '100ml', 'porcion'] as const;
export const TYPE_FILTER_KEYS = ['all', 'ingrediente', 'plato'] as const;
export const CATEGORY_FILTER_KEYS = [
  'all',
  'verduras_hortalizas',
  'frutas',
  'legumbres',
  'cereales_tuberculos',
  'lacteos',
  'carnes_huevos',
  'pescados_mariscos',
  'frutos_secos_semillas',
  'aceites_y_grasas',
  'salsas_y_cremas',
  'bebidas',
  'platos_completos',
  'dulces_y_desayuno',
] as const;

export type FoodCreateFormState = {
  caloriesKcal: string;
  carbsG: string;
  fatG: string;
  foodCategory: string;
  foodType: string;
  mediaType: string;
  mediaUrl: string;
  name: string;
  notes: string;
  proteinG: string;
  servingUnit: string;
};

export const EMPTY_FOOD_FORM: FoodCreateFormState = {
  caloriesKcal: '',
  carbsG: '',
  fatG: '',
  foodCategory: '',
  foodType: '',
  mediaType: '',
  mediaUrl: '',
  name: '',
  notes: '',
  proteinG: '',
  servingUnit: '',
};

type Unit = (typeof UNIT_FILTER_KEYS)[number];

export function buildFoodPayload(form: FoodCreateFormState) {
  return {
    servingUnit: normalizeServingUnitValue(form.servingUnit),
    foodType: normalizeNullable(form.foodType),
    foodCategory: normalizeNullable(form.foodCategory),
    caloriesKcal: parseOptionalNumber(form.caloriesKcal),
    proteinG: parseOptionalNumber(form.proteinG),
    carbsG: parseOptionalNumber(form.carbsG),
    fatG: parseOptionalNumber(form.fatG),
    notes: normalizeNullable(form.notes),
    mediaUrl: normalizeNullable(form.mediaUrl),
    mediaType: normalizeNullable(form.mediaType),
  };
}

export function resolveFoodFormError(
  form: FoodCreateFormState,
  t: (key: string) => string,
): string {
  if (!form.name.trim()) {
    return t('coach.clientProfile.validation.required');
  }
  if (!isServingUnit(form.servingUnit)) {
    return t('coach.library.foods.validation.servingUnitRequired');
  }
  if (form.servingUnit === 'porcion' && !form.notes.trim()) {
    return t('coach.library.foods.validation.notesRequiredForPortion');
  }
  return '';
}

export function isCategoryFilter(value: string): value is (typeof CATEGORY_FILTER_KEYS)[number] {
  return CATEGORY_FILTER_KEYS.includes(value as (typeof CATEGORY_FILTER_KEYS)[number]);
}

export function isTypeFilter(value: string): value is (typeof TYPE_FILTER_KEYS)[number] {
  return TYPE_FILTER_KEYS.includes(value as (typeof TYPE_FILTER_KEYS)[number]);
}

export function isUnitFilter(value: string): value is Unit {
  return UNIT_FILTER_KEYS.includes(value as Unit);
}

function isServingUnit(value: string): value is Exclude<Unit, 'all'> {
  return value === '100g' || value === '100ml' || value === 'porcion';
}

function normalizeServingUnitValue(value: string): '100g' | '100ml' | 'porcion' {
  if (value === '100g' || value === '100ml' || value === 'porcion') {
    return value;
  }
  return '100g';
}
