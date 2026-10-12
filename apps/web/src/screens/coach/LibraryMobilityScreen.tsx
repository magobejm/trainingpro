import React from 'react';
import { LibraryCategoryScreen, type LibraryCategoryConfig } from './LibraryCategoryScreen';
import { MobilityBaseFields } from './components/LibraryCreateFormFields';
import {
  useLibraryMobilityExercisesQuery,
  useLibraryMobilityTypesQuery,
  type MobilityExerciseLibraryItem,
} from '../../data/hooks/useLibraryQuery';
import {
  useCreateMobilityExerciseMutation,
  useUpdateMobilityExerciseMutation,
  useDeleteMobilityExerciseMutation,
} from '../../data/hooks/useLibrarySpecializedMutations';
import { EMPTY_MOBILITY_FORM, type MobilityCreateFormState } from './LibraryMobilityScreen.create';
import { LIST_KEYS } from '../../layout/list-context';
const config: LibraryCategoryConfig<MobilityExerciseLibraryItem, MobilityCreateFormState> = {
  category: 'mobility',
  titleKey: 'coach.library.mobility.title',
  listKey: LIST_KEYS.libraryMobility,
  emptyForm: EMPTY_MOBILITY_FORM,
  Fields: MobilityBaseFields,
  useItems: ({ query, type }) => useLibraryMobilityExercisesQuery({ query, mobilityType: type }),
  useCatalog: useLibraryMobilityTypesQuery,
  useCreate: useCreateMobilityExerciseMutation,
  useUpdate: useUpdateMobilityExerciseMutation,
  useDelete: useDeleteMobilityExerciseMutation,
  toForm: (item) => ({
    name: item.name,
    description: item.description ?? '',
    mobilityType: item.mobilityType ?? 'undefined',
    mediaUrl: item.media?.url ?? '',
    youtubeUrl: item.youtubeUrl ?? '',
  }),
  imageUrl: (item) => item.media?.url,
  subtitle: (item, t) => typeLabel(item.mobilityType ?? 'undefined', item.mobilityType ?? '', t),
  typeLabel,
};
function typeLabel(id: string, fallback: string, t: (key: string) => string): string {
  if (id === 'undefined') return t('coach.library.type.undefined');
  const key = 'coach.library.mobility.type.' + id;
  const translated = t(key);
  return translated !== key ? translated : fallback;
}
export function LibraryMobilityScreen(): React.JSX.Element {
  return <LibraryCategoryScreen config={config} />;
}
