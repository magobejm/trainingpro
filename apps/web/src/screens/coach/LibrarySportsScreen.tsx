import React from 'react';
import { LibraryCategoryScreen, type LibraryCategoryConfig } from './LibraryCategoryScreen';
import { SportBaseFields } from './components/LibraryCreateFormFields';
import { useLibrarySportsQuery, type SportLibraryItem } from '../../data/hooks/useLibraryQuery';
import {
  useCreateSportMutation,
  useUpdateSportMutation,
  useDeleteSportMutation,
} from '../../data/hooks/useLibrarySpecializedMutations';
import { EMPTY_SPORT_FORM, type SportCreateFormState } from './LibrarySportsScreen.create';
import { LIST_KEYS } from '../../layout/list-context';
const config: LibraryCategoryConfig<SportLibraryItem, SportCreateFormState> = {
  category: 'sport',
  titleKey: 'coach.library.menu.sports',
  listKey: LIST_KEYS.librarySports,
  emptyForm: EMPTY_SPORT_FORM,
  Fields: SportBaseFields,
  useItems: () => useLibrarySportsQuery(),
  useCatalog: () => null,
  useCreate: useCreateSportMutation,
  useUpdate: useUpdateSportMutation,
  useDelete: useDeleteSportMutation,
  toForm: (item) => ({
    icon: item.icon,
    name: item.name,
    description: item.description ?? '',
    mediaUrl: item.mediaUrl ?? '',
    youtubeUrl: item.youtubeUrl ?? '',
  }),
  imageUrl: (item) => item.mediaUrl,
  subtitle: (item, t) => t('coach.library.menu.sports'),
  typeLabel,
};
function typeLabel(id: string, fallback: string, t: (key: string) => string): string {
  if (id === 'undefined') return t('coach.library.type.undefined');
  const key = 'coach.library.sports.type.' + id;
  const translated = t(key);
  return translated !== key ? translated : fallback;
}
export function LibrarySportsScreen(): React.JSX.Element {
  return <LibraryCategoryScreen config={config} />;
}
