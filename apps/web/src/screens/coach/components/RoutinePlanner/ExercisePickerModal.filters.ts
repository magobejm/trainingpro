import type { AllCatalogs, UnifiedExercisesFilter } from '../../../../data/hooks/useUnifiedLibraryQuery';
import type { BlockType } from '../../RoutinePlanner.types';

export const PICKER_FILTERS: Record<BlockType, { catalog: keyof AllCatalogs; filter: keyof UnifiedExercisesFilter }> = {
  strength: { catalog: 'muscleGroups', filter: 'muscleGroupIds' },
  cardio: { catalog: 'cardioMethodTypes', filter: 'cardioTypeIds' },
  isometric: { catalog: 'isometricTypes', filter: 'isometricTypeIds' },
  plio: { catalog: 'plioTypes', filter: 'plioTypeIds' },
  mobility: { catalog: 'mobilityTypes', filter: 'mobilityTypeIds' },
  sport: { catalog: 'sportTypes', filter: 'sportTypeIds' },
};

export type PickerFilters = { categoryIds: string[]; equipmentIds: string[] };
export const EMPTY_PICKER_FILTERS: PickerFilters = { categoryIds: [], equipmentIds: [] };

export function pickerLibraryFilter(type: BlockType, selection: PickerFilters): UnifiedExercisesFilter {
  const config = PICKER_FILTERS[type];
  return { baseCategory: config.catalog, [config.filter]: selection.categoryIds };
}
