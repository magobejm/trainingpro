import type { ExerciseLibraryItem } from '../../data/hooks/useLibraryQuery';
import type { ExerciseWriteInput } from '../../data/hooks/useLibraryMutations';
import type { ExerciseCreateFormState } from './LibraryExercisesScreen.create';
import { normalizeNullable } from './libraryCreateForm.utils';

export function toExerciseForm(item: ExerciseLibraryItem): ExerciseCreateFormState {
  return {
    equipment: item.equipment ?? '',
    imageUrl: item.media.url ?? '',
    instructions: item.instructions ?? '',
    muscleGroupId: item.muscleGroupId,
    name: item.name,
    youtubeUrl: item.youtubeUrl ?? '',
  };
}

export function toExerciseUpdatePayload(
  current: ExerciseLibraryItem,
  form: ExerciseCreateFormState,
): ExerciseWriteInput {
  const muscleGroupId = form.muscleGroupId.trim() || current.muscleGroupId;
  return {
    equipment: normalizeNullable(form.equipment),
    instructions: normalizeNullable(form.instructions),
    mediaType: normalizeNullable(form.imageUrl) ? 'image' : null,
    mediaUrl: normalizeNullable(form.imageUrl),
    muscleGroupId,
    name: form.name.trim(),
    youtubeUrl: normalizeNullable(form.youtubeUrl),
  };
}
