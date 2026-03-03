/* eslint-disable max-lines, max-lines-per-function, no-restricted-syntax, max-len */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DimensionValue,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { FilterChips } from '@trainerpro/ui';
import { SearchBar } from '@trainerpro/ui';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { LibraryCreateCta } from './components/LibraryCreateCta';
import { LibraryCreateModal } from './components/LibraryCreateModal';
import { LibraryMediaFields } from './components/LibraryMediaFields';
import { PlioBaseFields } from './components/LibraryCreateFormFields';
import {
  useCreatePlioExerciseMutation,
  useDeletePlioExerciseMutation,
  useUpdatePlioExerciseMutation,
} from '../../data/hooks/useLibrarySpecializedMutations';
import { useUploadLibraryImageMutation } from '../../data/hooks/useLibraryMediaMutations';
import {
  useLibraryPlioTypesQuery,
  useLibraryPlioExercisesQuery,
  type PlioExerciseLibraryItem,
} from '../../data/hooks/useLibraryQuery';
import { libraryStyles as styles } from './library-screen.styles';
import { LibraryItemCard } from './components/LibraryItemCard';
import { readFrontEnv } from '../../data/env';
import { EMPTY_PLIO_FORM, type PlioCreateFormState } from './LibraryPlioScreen.create';
import { createFieldSetter } from './libraryCreateForm.utils';
import { uploadLibraryMediaImage } from './library-media.upload';

function resolvePlaceholder(): string {
  const env = readFrontEnv();
  const url = env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080';
  const apiBase = url.endsWith('/') ? url.slice(0, -1) : url;
  return `${apiBase}/assets/placeholders/plio-placeholder.png`;
}

const PLIO_PLACEHOLDER = resolvePlaceholder();

export function LibraryPlioScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedId, setExpandedId] = useState('');

  // State for CRUD
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState('');
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  const [form, setForm] = useState<PlioCreateFormState>(EMPTY_PLIO_FORM);
  const [editingItem, setEditingItem] = useState<PlioExerciseLibraryItem | null>(null);

  const plioType = activeFilter === 'all' ? undefined : activeFilter;
  const { data, isLoading } = useLibraryPlioExercisesQuery({ plioType, query });
  const items = data ?? [];
  const plioTypeCatalog = useLibraryPlioTypesQuery().data ?? [];
  const chips = [
    { id: 'all', label: t('coach.library.cardio.filters.all') },
    ...plioTypeCatalog.map((item) => ({
      id: item.id,
      label: toPlioTypeLabel(item.id, item.label, t),
    })),
  ];

  const createMutation = useCreatePlioExerciseMutation();
  const updateMutation = useUpdatePlioExerciseMutation();
  const deleteMutation = useDeletePlioExerciseMutation();
  const uploadImageMutation = useUploadLibraryImageMutation();

  const setField = createFieldSetter(setForm);

  const onOpenCreate = () => {
    setForm(EMPTY_PLIO_FORM);
    setCreateError('');
    setCreateModalVisible(true);
  };

  const onOpenEdit = (item: PlioExerciseLibraryItem) => {
    setEditingItem(item);
    setForm({
      description: item.description ?? '',
      equipment: item.equipment ?? '',
      mediaUrl: item.media?.url ?? '',
      name: item.name,
      plioType: item.plioType ?? 'undefined',
      youtubeUrl: item.youtubeUrl ?? '',
    });
    setEditError('');
    setEditModalVisible(true);
  };

  const onCreate = () => {
    if (!form.name.trim()) return;
    createMutation.mutate(form, {
      onSuccess: () => {
        setCreateModalVisible(false);
      },
      onError: (err) => setCreateError(err.message),
    });
  };

  const onSaveEdit = () => {
    if (!editingItem || !form.name.trim()) return;
    updateMutation.mutate(
      { itemId: editingItem.id, payload: form },
      {
        onSuccess: () => setEditModalVisible(false),
        onError: (err) => setEditError(err.message),
      },
    );
  };

  const onConfirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteMutation.mutate(pendingDeleteId, {
      onSuccess: () => setPendingDeleteId(''),
    });
  };

  const onUploadImage = (isEdit: boolean) => {
    const setError = isEdit ? setEditError : setCreateError;
    uploadLibraryMediaImage(uploadImageMutation, setField('mediaUrl'), setError);
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{t('coach.library.menu.plio')}</Text>
      <Text style={styles.subtitle}>{t('coach.library.exercises.subtitle')}</Text>

      <View style={styles.card}>
        <SearchBar
          onChangeText={setQuery}
          placeholder={t('coach.library.exercises.searchPlaceholder')}
          value={query}
        />
        <FilterChips activeId={activeFilter} items={chips} onSelect={setActiveFilter} />
      </View>

      <LibraryCreateCta
        buttonLabel={t('coach.library.actions.create')}
        onPress={onOpenCreate}
        subtitle={t('coach.library.exercises.cta.subtitle')}
        title={t('coach.library.exercises.cta.title')}
      />

      <LibraryCreateModal
        cancelLabel={t('coach.clients.modal.cancel')}
        isSubmitting={createMutation.isPending}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={onCreate}
        submitLabel={t('coach.library.actions.create')}
        submittingLabel={t('coach.library.exercises.modal.creating')}
        subtitle={t('coach.library.exercises.modal.subtitle')}
        title={t('coach.library.exercises.modal.title')}
        visible={createModalVisible}
      >
        <PlioBaseFields
          form={form as unknown as Record<string, string>}
          plioTypeOptions={chips.filter((item) => item.id !== 'all')}
          setField={setField}
          t={t}
        />
        <LibraryMediaFields
          imageUrl={form.mediaUrl}
          isUploading={uploadImageMutation.isPending}
          onUpload={() => onUploadImage(false)}
          setYoutubeUrl={setField('youtubeUrl')}
          t={t}
          youtubeUrl={form.youtubeUrl}
        />
        {createError ? <Text style={styles.error}>{t(createError)}</Text> : null}
      </LibraryCreateModal>

      <LibraryCreateModal
        cancelLabel={t('coach.clients.modal.cancel')}
        isSubmitting={updateMutation.isPending}
        onClose={() => setEditModalVisible(false)}
        onSubmit={onSaveEdit}
        submitLabel={t('coach.library.exercises.editModal.save')}
        submittingLabel={t('coach.library.exercises.editModal.saving')}
        subtitle={t('coach.library.exercises.editModal.subtitle')}
        title={t('coach.library.exercises.editModal.title')}
        visible={editModalVisible}
      >
        <PlioBaseFields
          form={form as unknown as Record<string, string>}
          plioTypeOptions={chips.filter((item) => item.id !== 'all')}
          setField={setField}
          t={t}
        />
        <LibraryMediaFields
          imageUrl={form.mediaUrl}
          isUploading={uploadImageMutation.isPending}
          onUpload={() => onUploadImage(true)}
          setYoutubeUrl={setField('youtubeUrl')}
          t={t}
          youtubeUrl={form.youtubeUrl}
        />
        {editError ? <Text style={styles.error}>{t(editError)}</Text> : null}
      </LibraryCreateModal>

      <ActionConfirmModal
        cancelLabel={t('coach.clients.modal.cancel')}
        confirmLabel={t('coach.library.exercises.actions.delete')}
        message={t('coach.library.exercises.actions.deleteConfirm')}
        onCancel={() => setPendingDeleteId('')}
        onConfirm={onConfirmDelete}
        title={t('coach.library.confirm.title')}
        visible={Boolean(pendingDeleteId)}
      />

      {isLoading ? (
        <ActivityIndicator size="large" style={localStyles.loader} color="#1c74e9" />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>{t('coach.library.empty')}</Text>
      ) : (
        <View style={gridStyles.grid}>
          {items.map((item) => (
            <View key={item.id} style={gridStyles.gridItem}>
              <LibraryItemCard
                deleting={deleteMutation.isPending && deleteMutation.variables === item.id}
                description={item.description || item.notes}
                descriptionLabelKey="coach.library.cardio.detail.description"
                detailRows={[
                  {
                    labelKey: 'coach.library.plio.detail.type',
                    value: item.plioType ? toPlioTypeLabel(item.plioType, item.plioType, t) : null,
                  },
                  { labelKey: 'coach.library.exercises.detail.equipment', value: item.equipment },
                ]}
                subtitle={`${item.equipment ?? ''}${item.equipment ? ' · ' : ''}${
                  item.plioType
                    ? toPlioTypeLabel(item.plioType, item.plioType, t)
                    : t('coach.library.type.undefined')
                }`}
                expanded={expandedId === item.id}
                imageUrl={item.media?.url || PLIO_PLACEHOLDER}
                name={item.name}
                onDelete={() => setPendingDeleteId(item.id)}
                onEdit={() => onOpenEdit(item)}
                onToggle={() => setExpandedId(expandedId === item.id ? '' : item.id)}
                scope={item.scope}
                t={t}
                youtubeUrl={item.youtubeUrl}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  loader: {
    marginTop: 40,
  },
});

function toPlioTypeLabel(id: string, fallback: string, t: (key: string) => string): string {
  if (id === 'undefined') return t('coach.library.type.undefined');
  if (id === 'explosivo' || id === 'relajado') {
    return t(`coach.library.plio.type.${id}`);
  }
  return fallback;
}

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -10,
    marginTop: 10,
    width: '100%' as DimensionValue,
  },
  gridItem: {
    flexBasis: '25%' as DimensionValue,
    flexGrow: 1,
    maxWidth: 400,
    minWidth: 280,
    padding: 10,
    width: '100%' as DimensionValue,
  },
});
