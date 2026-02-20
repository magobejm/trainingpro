import type { CardioMethodWriteInput } from '../../data/hooks/useLibraryMutations';
import type { CardioMethodLibraryItem } from '../../data/hooks/useLibraryQuery';
import { normalizeNullable } from './libraryCreateForm.utils';

export type CardioCreateFormState = {
  description: string;
  imageUrl: string;
  methodTypeId: string;
  name: string;
  youtubeUrl: string;
};

export const EMPTY_CARDIO_FORM: CardioCreateFormState = {
  description: '',
  imageUrl: '',
  methodTypeId: '',
  name: '',
  youtubeUrl: '',
};

export function toCardioForm(item: CardioMethodLibraryItem): CardioCreateFormState {
  return {
    description: item.description ?? '',
    imageUrl: item.media.url ?? '',
    methodTypeId: item.methodTypeId,
    name: item.name,
    youtubeUrl: item.youtubeUrl ?? '',
  };
}

export function toCardioPayload(
  form: CardioCreateFormState,
  methodTypeId: string,
  name: string,
): CardioMethodWriteInput {
  return {
    description: normalizeNullable(form.description),
    mediaType: normalizeNullable(form.imageUrl) ? 'image' : null,
    mediaUrl: normalizeNullable(form.imageUrl),
    methodTypeId,
    name,
    youtubeUrl: normalizeNullable(form.youtubeUrl),
  };
}
