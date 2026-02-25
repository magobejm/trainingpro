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
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { LibraryCreateCta } from './components/LibraryCreateCta';
import { LibraryCreateModal } from './components/LibraryCreateModal';
import { LibraryMediaFields } from './components/LibraryMediaFields';
import { SportBaseFields } from './components/LibraryCreateFormFields';
import { SearchBar } from '@trainerpro/ui';
import {
  useCreateSportMutation,
  useDeleteSportMutation,
  useUpdateSportMutation,
} from '../../data/hooks/useLibrarySpecializedMutations';
import { useUploadLibraryImageMutation } from '../../data/hooks/useLibraryMediaMutations';
import { useLibrarySportsQuery, type SportLibraryItem } from '../../data/hooks/useLibraryQuery';
import { libraryStyles as styles } from './library-screen.styles';
import { LibraryItemCard } from './components/LibraryItemCard';
import { readFrontEnv } from '../../data/env';
import { EMPTY_SPORT_FORM, type SportCreateFormState } from './LibrarySportsScreen.create';
import { createFieldSetter } from './libraryCreateForm.utils';
import { uploadLibraryMediaImage } from './library-media.upload';

function resolvePlaceholder(): string {
  const env = readFrontEnv();
  const url = env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080';
  const apiBase = url.endsWith('/') ? url.slice(0, -1) : url;
  return `${apiBase}/assets/placeholders/sports-placeholder.png`;
}

const SPORTS_PLACEHOLDER = resolvePlaceholder();

export function LibrarySportsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState('');

  // State for CRUD
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState('');
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  const [form, setForm] = useState<SportCreateFormState>(EMPTY_SPORT_FORM);
  const [editingItem, setEditingItem] = useState<SportLibraryItem | null>(null);

  const { data, isLoading } = useLibrarySportsQuery();
  // Frontend-side filtering for sports (api doesn't support query yet for sports)
  const items = (data ?? []).filter(
    (item) => !query || item.name.toLowerCase().includes(query.toLowerCase()),
  );

  const createMutation = useCreateSportMutation();
  const updateMutation = useUpdateSportMutation();
  const deleteMutation = useDeleteSportMutation();
  const uploadImageMutation = useUploadLibraryImageMutation();

  const setField = createFieldSetter(setForm);

  const onOpenCreate = () => {
    setForm(EMPTY_SPORT_FORM);
    setCreateError('');
    setCreateModalVisible(true);
  };

  const onOpenEdit = (item: SportLibraryItem) => {
    setEditingItem(item);
    setForm({
      description: item.description ?? '',
      mediaUrl: item.mediaUrl ?? '',
      name: item.name,
    });
    setEditError('');
    setEditModalVisible(true);
  };

  const onCreate = () => {
    if (!form.name.trim()) return;
    createMutation.mutate(
      { ...form, icon: '🏆' },
      {
        onSuccess: () => {
          setCreateModalVisible(false);
        },
        onError: (err) => setCreateError(err.message),
      },
    );
  };

  const onSaveEdit = () => {
    if (!editingItem || !form.name.trim()) return;
    updateMutation.mutate(
      { itemId: editingItem.id, payload: { ...form, icon: '🏆' } },
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
      <Text style={styles.title}>{t('coach.library.menu.sports')}</Text>
      <Text style={styles.subtitle}>{t('coach.library.exercises.subtitle')}</Text>

      <View style={styles.card}>
        <SearchBar
          onChangeText={setQuery}
          placeholder={t('coach.library.exercises.searchPlaceholder')}
          value={query}
        />
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
        subtitle={t('coach.library.sports.modal.subtitle')}
        title={t('coach.library.sports.modal.title')}
        visible={createModalVisible}
      >
        <SportBaseFields
          form={form as unknown as Record<string, string>}
          setField={setField}
          t={t}
        />
        <LibraryMediaFields
          imageUrl={form.mediaUrl}
          isUploading={uploadImageMutation.isPending}
          onUpload={() => onUploadImage(false)}
          t={t}
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
        subtitle={t('coach.library.sports.editModal.subtitle')}
        title={t('coach.library.sports.editModal.title')}
        visible={editModalVisible}
      >
        <SportBaseFields
          form={form as unknown as Record<string, string>}
          setField={setField}
          t={t}
        />
        <LibraryMediaFields
          imageUrl={form.mediaUrl}
          isUploading={uploadImageMutation.isPending}
          onUpload={() => onUploadImage(true)}
          t={t}
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
                description={item.description}
                expanded={expandedId === item.id}
                imageUrl={item.mediaUrl || SPORTS_PLACEHOLDER}
                name={`${item.icon} ${item.name}`}
                onDelete={() => setPendingDeleteId(item.id)}
                onEdit={() => onOpenEdit(item)}
                onToggle={() => setExpandedId(expandedId === item.id ? '' : item.id)}
                scope={item.scope}
                t={t}
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
