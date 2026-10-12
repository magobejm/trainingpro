import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { UseQueryResult } from '@tanstack/react-query';
import { Button, EmptyState, FilterChips, SearchBar, colors, fontSize, space, useToast } from '@trainerpro/ui';
import { QueryResult } from '../../components/AsyncStatus';
import { useQueryFilter } from '../../layout/useListContext';
import { useUploadLibraryImageMutation } from '../../data/hooks/useLibraryMediaMutations';
import { matchesSearch } from '../../utils/normalize-search';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { LibraryCreateModal } from './components/LibraryCreateModal';
import { LibraryMediaFields } from './components/LibraryMediaFields';
import { LibraryItemCard } from './components/LibraryItemCard';
import { LibraryItemDetailModal } from './components/LibraryItemDetailModal';
import { uploadLibraryMediaImage } from './library-media.upload';

type Item = {
  id: string;
  name: string;
  scope: 'coach' | 'global';
  description: string | null;
  youtubeUrl: string | null;
  equipment?: string | null;
  notes?: string | null;
};
type Mutation<Input> = { isPending: boolean; mutateAsync: (input: Input) => Promise<unknown> };
type CatalogItem = { id: string; label: string };
type FormFields = {
  form: Record<string, string>;
  setField: (field: string) => (value: string) => void;
  t: (key: string) => string;
  isometricTypeOptions?: CatalogItem[];
  plioTypeOptions?: CatalogItem[];
  mobilityTypeOptions?: CatalogItem[];
};
export type LibraryCategoryConfig<T extends Item, F extends Record<string, string>> = {
  category: 'isometric' | 'plio' | 'mobility' | 'sport';
  titleKey: string;
  listKey: string;
  emptyForm: F;
  Fields: React.ComponentType<FormFields>;
  useItems: (filter: { query: string; type?: string }) => UseQueryResult<T[], Error>;
  useCatalog: () => UseQueryResult<CatalogItem[], Error> | null;
  useCreate: () => Mutation<F>;
  useUpdate: () => Mutation<{ itemId: string; payload: Partial<F> }>;
  useDelete: () => Mutation<string> & { variables?: string };
  toForm: (item: T) => F;
  imageUrl: (item: T) => string | null;
  subtitle: (item: T, t: (key: string) => string) => string;
  typeLabel: (id: string, fallback: string, t: (key: string) => string) => string;
};

type Model<T extends Item, F extends Record<string, string>> = ReturnType<typeof useLibraryCategoryModel<T, F>>;
type ModelProps<T extends Item, F extends Record<string, string>> = { vm: Model<T, F> };

export function LibraryCategoryScreen<T extends Item, F extends Record<string, string>>({
  config,
}: {
  config: LibraryCategoryConfig<T, F>;
}): React.JSX.Element {
  const vm = useLibraryCategoryModel(config);
  return <LibraryCategoryView vm={vm} />;
}
function useLibraryCategoryModel<T extends Item, F extends Record<string, string>>(config: LibraryCategoryConfig<T, F>) {
  const { t } = useTranslation();
  const toast = useToast();
  const { activeFilter, query, setActiveFilter, setQuery } = useQueryFilter(config.listKey);
  const itemsQuery = config.useItems({ query, type: activeFilter === 'all' ? undefined : activeFilter });
  const catalogQuery = config.useCatalog();
  const create = config.useCreate();
  const update = config.useUpdate();
  const remove = config.useDelete();
  const upload = useUploadLibraryImageMutation();
  const [dialog, setDialog] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<F>(config.emptyForm);
  const [editing, setEditing] = useState<T | null>(null);
  const [expanded, setExpanded] = useState<T | null>(null);
  const [pendingDelete, setPendingDelete] = useState('');
  const [error, setError] = useState('');
  const items = (itemsQuery.data ?? []).filter((item) => matchesSearch(item.name, query));
  const chips = (catalogQuery?.data ?? []).map((item) => ({ id: item.id, label: config.typeLabel(item.id, item.label, t) }));
  const setField = (field: string) => (value: string) => setForm((current) => ({ ...current, [field]: value }));
  const openCreate = () => {
    setForm(config.emptyForm);
    setEditing(null);
    setError('');
    setDialog('create');
  };
  const openEdit = (item: T) => {
    setForm(config.toForm(item));
    setEditing(item);
    setError('');
    setDialog('edit');
  };
  const fail = (cause: unknown) => reportMutationFailure(cause, setError, t, toast);
  const save = async () => {
    if (!form.name?.trim() || create.isPending || update.isPending) return;
    setError('');
    try {
      if (dialog === 'edit' && editing) await update.mutateAsync({ itemId: editing.id, payload: form });
      else await create.mutateAsync(form);
      setDialog(null);
      toast.success(t('common.mutationSuccess'));
    } catch (cause) {
      fail(cause);
    }
  };
  const deleteSelected = async () => {
    if (!pendingDelete || remove.isPending) return;
    try {
      await remove.mutateAsync(pendingDelete);
      setPendingDelete('');
      toast.success(t('common.mutationSuccess'));
    } catch (cause) {
      fail(cause);
    }
  };
  const uploadImage = () =>
    uploadLibraryMediaImage(
      upload,
      (value) => {
        setField('mediaUrl')(value);
        toast.success(t('common.mutationSuccess'));
      },
      (message) => {
        setError(message);
        if (message) toast.error(t(message));
      },
    );
  return {
    config,
    t,
    activeFilter,
    query,
    setActiveFilter,
    setQuery,
    itemsQuery,
    catalogQuery,
    create,
    update,
    remove,
    upload,
    dialog,
    setDialog,
    form,
    setField,
    expanded,
    setExpanded,
    pendingDelete,
    setPendingDelete,
    error,
    setError,
    items,
    chips,
    openCreate,
    openEdit,
    save,
    deleteSelected,
    uploadImage,
  };
}
function LibraryCategoryView<T extends Item, F extends Record<string, string>>({ vm }: ModelProps<T, F>): React.JSX.Element {
  const { config, t, activeFilter, query, setActiveFilter, setQuery, catalogQuery, chips, openCreate } = vm;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{t(config.titleKey)}</Text>
        <View style={styles.actions}>
          <SearchBar onChangeText={setQuery} placeholder={t('coach.library.exercises.searchPlaceholder')} value={query} />
          <Button label={t('coach.library.actions.create')} onPress={openCreate} />
        </View>
      </View>
      {catalogQuery ? (
        <FilterChips
          activeId={activeFilter}
          items={[{ id: 'all', label: t('coach.library.cardio.filters.all') }, ...chips]}
          onSelect={setActiveFilter}
        />
      ) : null}
      <LibraryCategoryList vm={vm} />
      <LibraryCategoryEditor vm={vm} />
      <LibraryCategoryDialogs vm={vm} />
    </ScrollView>
  );
}
function LibraryCategoryList<T extends Item, F extends Record<string, string>>({ vm }: ModelProps<T, F>): React.JSX.Element {
  const {
    config,
    t,
    activeFilter,
    query,
    itemsQuery,
    catalogQuery,
    items,
    openCreate,
    expanded,
    remove,
    setExpanded,
    openEdit,
    setError,
    setPendingDelete,
  } = vm;
  const status = QueryResult({
    emptyTitle: t('coach.library.empty'),
    error: itemsQuery.error ?? catalogQuery?.error,
    isError: itemsQuery.isError || Boolean(catalogQuery?.isError),
    isLoading: itemsQuery.isLoading || Boolean(catalogQuery?.isLoading),
    itemCount: items.length,
    hasActiveFilter: Boolean(query.trim()) || activeFilter !== 'all',
    onRetry: () => {
      void itemsQuery.refetch();
      void catalogQuery?.refetch();
    },
  });
  const trulyEmpty =
    !itemsQuery.isLoading &&
    !itemsQuery.isError &&
    !catalogQuery?.isError &&
    !catalogQuery?.isLoading &&
    !items.length &&
    !query.trim() &&
    activeFilter === 'all';
  return (
    <>
      {trulyEmpty ? (
        <EmptyState
          actionLabel={t('coach.library.actions.create')}
          message={t('coach.library.emptyHint')}
          onAction={openCreate}
          title={t('coach.library.empty')}
        />
      ) : (
        (status ?? (
          <View style={styles.grid}>
            {items.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <LibraryItemCard
                  category={config.category}
                  name={item.name}
                  scope={item.scope}
                  imageUrl={config.imageUrl(item)}
                  equipment={item.equipment}
                  subtitle={config.subtitle(item, t)}
                  expanded={expanded?.id === item.id}
                  deleting={remove.isPending && remove.variables === item.id}
                  onToggle={() => setExpanded(item)}
                  onEdit={() => openEdit(item)}
                  onDelete={() => {
                    setError('');
                    setPendingDelete(item.id);
                  }}
                  t={t}
                />
              </View>
            ))}
          </View>
        ))
      )}
    </>
  );
}
function LibraryCategoryEditor<T extends Item, F extends Record<string, string>>({
  vm,
}: ModelProps<T, F>): React.JSX.Element {
  const { config, t, create, update, dialog, setDialog, save, form, setField, chips, upload, uploadImage, error } = vm;
  return (
    <LibraryCreateModal
      cancelLabel={t('common.cancel')}
      isSubmitting={create.isPending || update.isPending}
      onClose={() => setDialog(null)}
      onSubmit={() => void save()}
      submitLabel={t(dialog === 'edit' ? 'coach.library.exercises.editModal.save' : 'coach.library.actions.create')}
      submittingLabel={t('coach.library.exercises.editModal.saving')}
      title={t(config.titleKey)}
      visible={dialog !== null}
      formContent={
        <config.Fields
          form={form}
          setField={setField}
          t={t}
          isometricTypeOptions={chips}
          plioTypeOptions={chips}
          mobilityTypeOptions={chips}
        />
      }
      mediaContent={
        <LibraryMediaFields
          category={config.category}
          imageUrl={form.mediaUrl ?? ''}
          isUploading={upload.isPending}
          onUpload={() => void uploadImage()}
          onRemoveImage={() => setField('mediaUrl')('')}
          setYoutubeUrl={setField('youtubeUrl')}
          t={t}
          youtubeUrl={form.youtubeUrl ?? ''}
        />
      }
      errorContent={
        error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {t(error)}
          </Text>
        ) : null
      }
    />
  );
}
function LibraryCategoryDialogs<T extends Item, F extends Record<string, string>>({
  vm,
}: ModelProps<T, F>): React.JSX.Element {
  const { config, t, expanded, setExpanded, error, pendingDelete, setPendingDelete, deleteSelected } = vm;
  return (
    <>
      <LibraryItemDetailModal
        item={
          expanded
            ? {
                ...expanded,
                description: expanded.description || expanded.notes,
                media: { url: config.imageUrl(expanded) },
                methodType: config.subtitle(expanded, t),
              }
            : null
        }
        onClose={() => setExpanded(null)}
        t={t}
        type={config.category}
      />
      {error && pendingDelete ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {t(error)}
        </Text>
      ) : null}
      <ActionConfirmModal
        cancelLabel={t('common.cancel')}
        confirmLabel={t('coach.library.exercises.actions.delete')}
        message={t('coach.library.exercises.actions.deleteConfirm')}
        onCancel={() => setPendingDelete('')}
        onConfirm={() => void deleteSelected()}
        title={t('coach.library.confirm.title')}
        visible={Boolean(pendingDelete)}
      />
    </>
  );
}

function reportMutationFailure(
  cause: unknown,
  setError: (message: string) => void,
  t: (key: string) => string,
  toast: ReturnType<typeof useToast>,
): void {
  const message = cause instanceof Error ? cause.message : t('common.mutationError');
  setError(message);
  toast.error(t(message));
}
const styles = StyleSheet.create({
  page: { backgroundColor: colors.background, padding: space.xl, gap: space.lg, minHeight: '100%' },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: space.lg },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  gridItem: { flexBasis: 280, flexGrow: 1, maxWidth: 400, minWidth: 0 },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
