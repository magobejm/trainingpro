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
import { IsometricBaseFields } from './components/LibraryCreateFormFields';
import {
  useCreateIsometricExerciseMutation,
  useDeleteIsometricExerciseMutation,
  useUpdateIsometricExerciseMutation,
} from '../../data/hooks/useLibrarySpecializedMutations';
import { useUploadLibraryImageMutation } from '../../data/hooks/useLibraryMediaMutations';
import {
  useLibraryIsometricTypesQuery,
  useLibraryIsometricExercisesQuery,
  type IsometricExerciseLibraryItem,
} from '../../data/hooks/useLibraryQuery';
import { libraryStyles as styles } from './library-screen.styles';
import { LibraryItemCard } from './components/LibraryItemCard';
import { LibraryItemDetailModal } from './components/LibraryItemDetailModal';
import { EMPTY_ISOMETRIC_FORM, type IsometricCreateFormState } from './LibraryIsometricScreen.create';
import { createFieldSetter } from './libraryCreateForm.utils';
import { uploadLibraryMediaImage } from './library-media.upload';

export function LibraryIsometricScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedId, setExpandedId] = useState('');

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState('');
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  const [form, setForm] = useState<IsometricCreateFormState>(EMPTY_ISOMETRIC_FORM);
  const [editingItem, setEditingItem] = useState<IsometricExerciseLibraryItem | null>(null);

  const isometricType = activeFilter === 'all' ? undefined : activeFilter;
  const { data, isLoading } = useLibraryIsometricExercisesQuery({ isometricType, query });
  const items = data ?? [];
  const isometricTypeCatalog = useLibraryIsometricTypesQuery().data ?? [];
  const chips = [
    { id: 'all', label: t('coach.library.cardio.filters.all') },
    ...isometricTypeCatalog.map((item) => ({
      id: item.id,
      label: toIsometricTypeLabel(item.id, item.label, t),
    })),
  ];

  const expandedItem = items.find((i) => i.id === expandedId) || null;

  const createMutation = useCreateIsometricExerciseMutation();
  const updateMutation = useUpdateIsometricExerciseMutation();
  const deleteMutation = useDeleteIsometricExerciseMutation();
  const uploadImageMutation = useUploadLibraryImageMutation();

  const setField = createFieldSetter(setForm);

  const onOpenCreate = () => {
    setForm(EMPTY_ISOMETRIC_FORM);
    setCreateError('');
    setCreateModalVisible(true);
  };

  const onOpenEdit = (item: IsometricExerciseLibraryItem) => {
    setEditingItem(item);
    setForm({
      description: item.description ?? '',
      equipment: item.equipment ?? '',
      isometricType: item.isometricType ?? 'undefined',
      mediaUrl: item.media?.url ?? '',
      name: item.name,
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
                  category="isometric"
                  deleting={deleteMutation.isPending && deleteMutation.variables === item.id}
                  equipment={item.equipment}
                  expanded={expandedId === item.id}
                  imageUrl={item.media?.url}
                  name={item.name}
                  onDelete={() => setPendingDeleteId(item.id)}
                  onEdit={() => onOpenEdit(item)}
                  onToggle={() => setExpandedId(expandedId === item.id ? '' : item.id)}
                  scope={item.scope}
                  subtitle={
                    item.isometricType
                      ? toIsometricTypeLabel(item.isometricType, item.isometricType, t)
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
          <IsometricBaseFields
            form={form as unknown as Record<string, string>}
            isometricTypeOptions={chips.filter((item) => item.id !== 'all')}
            setField={setField}
            t={t}
          />
        }
        mediaContent={
          <LibraryMediaFields
            category="isometric"
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
          <IsometricBaseFields
            form={form as unknown as Record<string, string>}
            isometricTypeOptions={chips.filter((item) => item.id !== 'all')}
            setField={setField}
            t={t}
          />
        }
        mediaContent={
          <LibraryMediaFields
            category="isometric"
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
                description: expandedItem.description || expandedItem.notes,
                methodType: expandedItem.isometricType
                  ? toIsometricTypeLabel(expandedItem.isometricType, expandedItem.isometricType, t)
                  : undefined,
              }
            : null
        }
        onClose={() => setExpandedId('')}
        t={t}
        type="isometric"
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
      <Text style={topBarStyles.title}>{t('coach.library.isometrics.title')}</Text>
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

function toIsometricTypeLabel(id: string, fallback: string, t: (key: string) => string): string {
  if (id === 'undefined') return t('coach.library.type.undefined');
  const key = `coach.library.isometric.type.${id}`;
  const translated = t(key);
  return translated !== key ? translated : fallback;
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
