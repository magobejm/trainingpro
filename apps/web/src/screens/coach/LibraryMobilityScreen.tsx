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
  Pressable,
} from 'react-native';
import { FilterChips, SearchBar } from '@trainerpro/ui';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { LibraryCreateModal } from './components/LibraryCreateModal';
import { LibraryMediaFields } from './components/LibraryMediaFields';
import { MobilityBaseFields } from './components/LibraryCreateFormFields';
import {
  useCreateMobilityExerciseMutation,
  useDeleteMobilityExerciseMutation,
  useUpdateMobilityExerciseMutation,
} from '../../data/hooks/useLibrarySpecializedMutations';
import { useUploadLibraryImageMutation } from '../../data/hooks/useLibraryMediaMutations';
import {
  useLibraryMobilityTypesQuery,
  useLibraryMobilityExercisesQuery,
  type MobilityExerciseLibraryItem,
} from '../../data/hooks/useLibraryQuery';
import { libraryStyles as styles } from './library-screen.styles';
import { LibraryItemCard } from './components/LibraryItemCard';
import { LibraryItemDetailModal } from './components/LibraryItemDetailModal';
import { EMPTY_MOBILITY_FORM, type MobilityCreateFormState } from './LibraryMobilityScreen.create';
import { createFieldSetter } from './libraryCreateForm.utils';
import { uploadLibraryMediaImage } from './library-media.upload';

export function LibraryMobilityScreen(): React.JSX.Element {
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
  const [form, setForm] = useState<MobilityCreateFormState>(EMPTY_MOBILITY_FORM);
  const [editingItem, setEditingItem] = useState<MobilityExerciseLibraryItem | null>(null);

  const mobilityType = activeFilter === 'all' ? undefined : activeFilter;
  const { data, isLoading } = useLibraryMobilityExercisesQuery({ query, mobilityType });
  const items = data ?? [];
  const mobilityTypeCatalog = useLibraryMobilityTypesQuery().data ?? [];
  const chips = [
    { id: 'all', label: t('coach.library.cardio.filters.all') },
    ...mobilityTypeCatalog.map((item) => ({
      id: item.id,
      label: toMobilityTypeLabel(item.id, item.label, t),
    })),
  ];

  const expandedItem = items.find((i) => i.id === expandedId) || null;

  const createMutation = useCreateMobilityExerciseMutation();
  const updateMutation = useUpdateMobilityExerciseMutation();
  const deleteMutation = useDeleteMobilityExerciseMutation();
  const uploadImageMutation = useUploadLibraryImageMutation();

  const setField = createFieldSetter(setForm);

  const onOpenCreate = () => {
    setForm(EMPTY_MOBILITY_FORM);
    setCreateError('');
    setCreateModalVisible(true);
  };

  const onOpenEdit = (item: MobilityExerciseLibraryItem) => {
    setEditingItem(item);
    setForm({
      description: item.description ?? '',
      mediaUrl: item.media?.url ?? '',
      name: item.name,
      mobilityType: item.mobilityType ?? 'undefined',
      youtubeUrl: item.youtubeUrl ?? '',
    });
    setEditError('');
    setEditModalVisible(true);
  };

  const onCreate = () => {
    if (!form.name.trim()) return;
    createMutation.mutate(form, {
      onSuccess: () => setCreateModalVisible(false),
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
    <View style={styles.page}>
      <TopBar onOpenCreate={onOpenCreate} query={query} setQuery={setQuery} t={t} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.filtersWrapper}>
          <FilterChips activeId={activeFilter} items={chips} onSelect={setActiveFilter} />
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" style={localStyles.loader} color="#1c74e9" />
        ) : items.length === 0 ? (
          <Text style={styles.empty}>{t('coach.library.empty')}</Text>
        ) : (
          <View style={gridStyles.grid}>
            {items.map((item) => (
              <View key={item.id} style={gridStyles.gridItem}>
                <LibraryItemCard
                  category="warmup"
                  deleting={deleteMutation.isPending && deleteMutation.variables === item.id}
                  expanded={expandedId === item.id}
                  imageUrl={item.media?.url}
                  name={item.name}
                  onDelete={() => setPendingDeleteId(item.id)}
                  onEdit={() => onOpenEdit(item)}
                  onToggle={() => setExpandedId(expandedId === item.id ? '' : item.id)}
                  scope={item.scope}
                  subtitle={
                    item.mobilityType
                      ? toMobilityTypeLabel(item.mobilityType, item.mobilityType, t)
                      : t('coach.library.type.undefined')
                  }
                  t={t}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <LibraryCreateModal
        cancelLabel={t('coach.clients.modal.cancel')}
        isSubmitting={createMutation.isPending}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={onCreate}
        submitLabel={t('coach.library.actions.create')}
        submittingLabel={t('coach.library.exercises.modal.creating')}
        title={t('coach.library.exercises.modal.title')}
        visible={createModalVisible}
        formContent={
          <MobilityBaseFields
            form={form as unknown as Record<string, string>}
            mobilityTypeOptions={chips.filter((item) => item.id !== 'all')}
            setField={setField}
            t={t}
          />
        }
        mediaContent={
          <LibraryMediaFields
            category="warmup"
            imageUrl={form.mediaUrl}
            isUploading={uploadImageMutation.isPending}
            onUpload={() => onUploadImage(false)}
            onRemoveImage={() => setField('mediaUrl')('')}
            setYoutubeUrl={setField('youtubeUrl')}
            t={t}
            youtubeUrl={form.youtubeUrl}
          />
        }
        errorContent={createError ? <Text style={styles.error}>{t(createError)}</Text> : null}
      />

      <LibraryCreateModal
        cancelLabel={t('coach.clients.modal.cancel')}
        isSubmitting={updateMutation.isPending}
        onClose={() => setEditModalVisible(false)}
        onSubmit={onSaveEdit}
        submitLabel={t('coach.library.exercises.editModal.save')}
        submittingLabel={t('coach.library.exercises.editModal.saving')}
        title={t('coach.library.exercises.editModal.title')}
        visible={editModalVisible}
        formContent={
          <MobilityBaseFields
            form={form as unknown as Record<string, string>}
            mobilityTypeOptions={chips.filter((item) => item.id !== 'all')}
            setField={setField}
            t={t}
          />
        }
        mediaContent={
          <LibraryMediaFields
            category="warmup"
            imageUrl={form.mediaUrl}
            isUploading={uploadImageMutation.isPending}
            onUpload={() => onUploadImage(true)}
            onRemoveImage={() => setField('mediaUrl')('')}
            setYoutubeUrl={setField('youtubeUrl')}
            t={t}
            youtubeUrl={form.youtubeUrl}
          />
        }
        errorContent={editError ? <Text style={styles.error}>{t(editError)}</Text> : null}
      />

      <LibraryItemDetailModal
        item={
          expandedItem
            ? {
                ...expandedItem,
                description: expandedItem.description,
                methodType: expandedItem.mobilityType
                  ? toMobilityTypeLabel(expandedItem.mobilityType, expandedItem.mobilityType, t)
                  : undefined,
              }
            : null
        }
        onClose={() => setExpandedId('')}
        t={t}
        type="warmup"
      />

      <ActionConfirmModal
        cancelLabel={t('coach.clients.modal.cancel')}
        confirmLabel={t('coach.library.exercises.actions.delete')}
        message={t('coach.library.exercises.actions.deleteConfirm')}
        onCancel={() => setPendingDeleteId('')}
        onConfirm={onConfirmDelete}
        title={t('coach.library.confirm.title')}
        visible={Boolean(pendingDeleteId)}
      />
    </View>
  );
}

function TopBar({
  t,
  query,
  setQuery,
  onOpenCreate,
}: {
  t: (key: string) => string;
  query: string;
  setQuery: (value: string) => void;
  onOpenCreate: () => void;
}) {
  return (
    <View style={topBarStyles.container}>
      <Text style={topBarStyles.title}>{t('coach.library.mobility.title')}</Text>
      <View style={topBarStyles.actions}>
        <View style={topBarStyles.searchWrapper}>
          <SearchBar
            onChangeText={setQuery}
            placeholder={t('coach.library.exercises.searchPlaceholder')}
            value={query}
          />
        </View>
        <Pressable onPress={onOpenCreate} style={topBarStyles.createBtn}>
          <Text style={topBarStyles.createBtnText}>{t('coach.library.actions.create')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const topBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    width: '100%',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  searchWrapper: { width: 320 },
  createBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});

const localStyles = StyleSheet.create({
  loader: { marginTop: 40 },
});

function toMobilityTypeLabel(id: string, fallback: string, t: (key: string) => string): string {
  if (id === 'undefined') return t('coach.library.type.undefined');
  if (id === 'warmup' || id === 'mobility' || id === 'plio' || id === 'cardio' || id === 'sport') {
    return t(`coach.library.warmup.type.${id}`);
  }
  return fallback;
}

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    width: '100%' as DimensionValue,
  },
  gridItem: { width: 340 },
});
