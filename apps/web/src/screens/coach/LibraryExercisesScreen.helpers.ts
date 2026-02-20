import type { LibraryCatalogItem } from '../../data/hooks/useLibraryQuery';
import type { ExerciseCreateFormState } from './LibraryExercisesScreen.create';
import { buildExercisePayload } from './LibraryExercisesScreen.create';
import { isYouTubeUrl } from './library-media.helpers';

export function buildExerciseInput(
  form: ExerciseCreateFormState,
  activeFilter: string,
  defaultId: string,
  name: string,
) {
  const muscleGroupId = resolveCatalogId(form.muscleGroupId, activeFilter, defaultId);
  return { name, ...buildExercisePayload(form, muscleGroupId) };
}

export function onCreateExerciseSuccess(
  resetForm: () => void,
  setCreateModalVisible: (value: boolean) => void,
): void {
  resetForm();
  setCreateModalVisible(false);
}

export function validateYoutube(value: string): null | string {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return isYouTubeUrl(trimmed) ? null : 'coach.library.media.errors.invalidYoutube';
}

export function buildCatalogChips(
  items: LibraryCatalogItem[],
  t: (key: string) => string,
): Array<{ id: string; label: string }> {
  return [{ id: 'all', label: t('coach.library.exercises.filters.all') }, ...items.map(toChip)];
}

export function resolveCatalogId(value: string, activeFilter: string, defaultId: string): string {
  const explicit = value.trim();
  if (explicit) {
    return explicit;
  }
  if (activeFilter && activeFilter !== 'all') {
    return activeFilter;
  }
  return defaultId;
}

export function findDefaultCatalogId(items: LibraryCatalogItem[]): string {
  return items.find((item) => item.isDefault)?.id ?? items[0]?.id ?? '';
}

function toChip(item: LibraryCatalogItem) {
  return { id: item.id, label: item.label };
}
