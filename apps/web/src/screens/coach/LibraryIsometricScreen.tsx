import React from 'react';
import { LibraryCategoryScreen, type LibraryCategoryConfig } from './LibraryCategoryScreen';
import { IsometricBaseFields } from './components/LibraryCreateFormFields';
import {
  useLibraryIsometricExercisesQuery,
  useLibraryIsometricTypesQuery,
  type IsometricExerciseLibraryItem,
} from '../../data/hooks/useLibraryQuery';
import {
  useCreateIsometricExerciseMutation,
  useUpdateIsometricExerciseMutation,
  useDeleteIsometricExerciseMutation,
} from '../../data/hooks/useLibrarySpecializedMutations';
import { EMPTY_ISOMETRIC_FORM, type IsometricCreateFormState } from './LibraryIsometricScreen.create';
import { LIST_KEYS } from '../../layout/list-context';
const config: LibraryCategoryConfig<IsometricExerciseLibraryItem, IsometricCreateFormState> = {
  category: 'isometric',
  titleKey: 'coach.library.isometrics.title',
  listKey: LIST_KEYS.libraryIsometric,
  emptyForm: EMPTY_ISOMETRIC_FORM,
  Fields: IsometricBaseFields,
  useItems: ({ query, type }) => useLibraryIsometricExercisesQuery({ query, isometricType: type }),
  useCatalog: useLibraryIsometricTypesQuery,
  useCreate: useCreateIsometricExerciseMutation,
  useUpdate: useUpdateIsometricExerciseMutation,
  useDelete: useDeleteIsometricExerciseMutation,
  toForm: (item) => ({
    name: item.name,
    description: item.description ?? '',
    equipment: item.equipment ?? '',
    isometricType: item.isometricType ?? 'undefined',
    mediaUrl: item.media?.url ?? '',
    youtubeUrl: item.youtubeUrl ?? '',
  }),
  imageUrl: (item) => item.media?.url,
  subtitle: (item, t) => typeLabel(item.isometricType ?? 'undefined', item.isometricType ?? '', t),
  typeLabel,
};
function typeLabel(id: string, fallback: string, t: (key: string) => string): string {
  if (id === 'undefined') return t('coach.library.type.undefined');
  const key = 'coach.library.isometric.type.' + id;
  const translated = t(key);
  return translated !== key ? translated : fallback;
}
export function LibraryIsometricScreen(): React.JSX.Element {
  return <LibraryCategoryScreen config={config} />;
}
