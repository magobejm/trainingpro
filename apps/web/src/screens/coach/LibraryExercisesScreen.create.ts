import { normalizeNullable } from './libraryCreateForm.utils';

export type ExerciseCreateFormState = {
  equipment: string;
  imageUrl: string;
  instructions: string;
  muscleGroupId: string;
  name: string;
  youtubeUrl: string;
};

export const EMPTY_EXERCISE_FORM: ExerciseCreateFormState = {
  equipment: '',
  imageUrl: '',
  instructions: '',
  muscleGroupId: '',
  name: '',
  youtubeUrl: '',
};

export function buildExercisePayload(form: ExerciseCreateFormState, muscleGroupId: string) {
  return {
    equipment: normalizeNullable(form.equipment),
    instructions: normalizeNullable(form.instructions),
    mediaType: normalizeNullable(form.imageUrl) ? 'image' : null,
    mediaUrl: normalizeNullable(form.imageUrl),
    muscleGroupId,
    youtubeUrl: normalizeNullable(form.youtubeUrl),
  };
}
