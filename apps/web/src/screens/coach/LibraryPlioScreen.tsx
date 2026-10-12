import React from 'react';
import { LibraryCategoryScreen, type LibraryCategoryConfig } from './LibraryCategoryScreen';
import { PlioBaseFields } from './components/LibraryCreateFormFields';
import {
  useLibraryPlioExercisesQuery,
  useLibraryPlioTypesQuery,
  type PlioExerciseLibraryItem,
} from '../../data/hooks/useLibraryQuery';
import {
  useCreatePlioExerciseMutation,
  useUpdatePlioExerciseMutation,
  useDeletePlioExerciseMutation,
} from '../../data/hooks/useLibrarySpecializedMutations';
import { EMPTY_PLIO_FORM, type PlioCreateFormState } from './LibraryPlioScreen.create';
import { LIST_KEYS } from '../../layout/list-context';
const config: LibraryCategoryConfig<PlioExerciseLibraryItem, PlioCreateFormState> = {
  category: 'plio',
  titleKey: 'coach.library.plyometrics.title',
  listKey: LIST_KEYS.libraryPlio,
  emptyForm: EMPTY_PLIO_FORM,
  Fields: PlioBaseFields,
  useItems: ({ query, type }) => useLibraryPlioExercisesQuery({ query, plioType: type }),
  useCatalog: useLibraryPlioTypesQuery,
  useCreate: useCreatePlioExerciseMutation,
  useUpdate: useUpdatePlioExerciseMutation,
  useDelete: useDeletePlioExerciseMutation,
  toForm: (item) => ({
    name: item.name,
    description: item.description ?? '',
    equipment: item.equipment ?? '',
    plioType: item.plioType ?? 'undefined',
    mediaUrl: item.media?.url ?? '',
    youtubeUrl: item.youtubeUrl ?? '',
  }),
  imageUrl: (item) => item.media?.url,
  subtitle: (item, t) => typeLabel(item.plioType ?? 'undefined', item.plioType ?? '', t),
  typeLabel,
};
function typeLabel(id: string, fallback: string, t: (key: string) => string): string {
  if (id === 'undefined') return t('coach.library.type.undefined');
  const key = 'coach.library.plio.type.' + id;
  const translated = t(key);
  return translated !== key ? translated : fallback;
}
export function LibraryPlioScreen(): React.JSX.Element {
  return <LibraryCategoryScreen config={config} />;
}
