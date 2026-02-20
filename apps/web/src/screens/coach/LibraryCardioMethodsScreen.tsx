import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import {
  useCreateCardioMethodMutation,
  useDeleteCardioMethodMutation,
  useUpdateCardioMethodMutation,
  useUploadLibraryImageMutation,
} from '../../data/hooks/useLibraryMutations';
import {
  useLibraryCardioMethodsQuery,
  useLibraryCardioMethodTypesQuery,
  type CardioMethodLibraryItem,
} from '../../data/hooks/useLibraryQuery';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { LibraryCardioMethodsView } from './components/LibraryCardioMethodsView';
import {
  EMPTY_CARDIO_FORM,
  toCardioForm,
  type CardioCreateFormState,
} from './library-cardio.edit';
import { buildCardioChips, findDefaultCardioTypeId } from './library-cardio.helpers';
import {
  confirmCardioDelete,
  createCardio,
  saveCardioEdit,
} from './library-cardio.operations';
import { createFieldSetter } from './libraryCreateForm.utils';
import { uploadLibraryMediaImage } from './library-media.upload';

export function LibraryCardioMethodsScreen(): React.JSX.Element {
  const vm = useCardioMethodsViewModel();
  return (
    <>
      <LibraryCardioMethodsView {...vm} />
      <ActionConfirmModal
        cancelLabel={vm.t('coach.clients.modal.cancel')}
        confirmLabel={vm.t('coach.library.exercises.actions.delete')}
        message={vm.t('coach.library.cardio.actions.deleteConfirm')}
        onCancel={vm.onCancelDelete}
        onConfirm={vm.onConfirmDelete}
        title={vm.t('coach.library.confirm.title')}
        visible={Boolean(vm.pendingDeleteId)}
      />
    </>
  );
}

function useCardioMethodsViewModel() {
  const { t } = useTranslation();
  const state = useCardioState();
  const createForm = useCreateForm();
  const editForm = useEditForm();
  const refs = useCardioResources(state);
  useDefaultCardioType(createForm, refs.defaultTypeId);
  const chips = useMemo(() => buildCardioChips(refs.catalogItems, t), [refs.catalogItems, t]);
  return buildCardioViewModel(state, createForm, editForm, refs, chips, t);
}

function buildCardioViewModel(
  state: ReturnType<typeof useCardioState>,
  createForm: ReturnType<typeof useCreateForm>,
  editForm: ReturnType<typeof useEditForm>,
  refs: ReturnType<typeof useCardioResources>,
  chips: Array<{ id: string; label: string }>,
  t: (key: string) => string,
) {
  return {
    ...buildCardioViewState(state, createForm, editForm, refs, chips),
    ...buildCardioActions(state, createForm, editForm, refs),
    pendingDeleteId: state.pendingDeleteId,
    query: state.query,
    setQuery: state.setQuery,
    t,
  };
}

function buildCardioViewState(
  state: ReturnType<typeof useCardioState>,
  createForm: ReturnType<typeof useCreateForm>,
  editForm: ReturnType<typeof useEditForm>,
  refs: ReturnType<typeof useCardioResources>,
  chips: Array<{ id: string; label: string }>,
) {
  return {
    activeFilter: state.activeFilter,
    chips,
    createError: state.createError,
    createForm: createForm.form,
    createModalVisible: state.createModalVisible,
    createSubmitting: refs.createMutation.isPending,
    createUploading: createForm.uploadImageMutation.isPending,
    deleteError: state.deleteError,
    deletingId: state.deletingId,
    editError: editForm.editError,
    editForm: editForm.form,
    editModalVisible: editForm.visible,
    editSubmitting: refs.updateMutation.isPending,
    editUploading: editForm.uploadImageMutation.isPending,
    expandedId: state.expandedId,
    items: refs.listItems,
    methodTypeOptions: refs.catalogItems,
  };
}

function useCardioResources(state: ReturnType<typeof useCardioState>) {
  const createMutation = useCreateCardioMethodMutation();
  const deleteMutation = useDeleteCardioMethodMutation();
  const updateMutation = useUpdateCardioMethodMutation();
  const catalogQuery = useLibraryCardioMethodTypesQuery();
  const catalogItems = catalogQuery.data ?? [];
  const defaultTypeId = findDefaultCardioTypeId(catalogItems);
  const methodTypeId = state.activeFilter === 'all' ? undefined : state.activeFilter;
  const listQuery = useLibraryCardioMethodsQuery({ methodTypeId, query: state.query });
  return {
    catalogItems,
    createMutation,
    defaultTypeId,
    deleteMutation,
    listItems: listQuery.data ?? [],
    updateMutation,
  };
}

function useDefaultCardioType(
  createForm: ReturnType<typeof useCreateForm>,
  defaultTypeId: string,
): void {
  useEffect(() => {
    if (defaultTypeId && !createForm.form.methodTypeId) {
      createForm.setField('methodTypeId')(defaultTypeId);
    }
  }, [createForm, defaultTypeId]);
}

function buildCardioActions(
  state: ReturnType<typeof useCardioState>,
  createForm: ReturnType<typeof useCreateForm>,
  editForm: ReturnType<typeof useEditForm>,
  refs: ReturnType<typeof useCardioResources>,
) {
  return {
    ...buildCardioPrimaryActions(state, createForm, editForm, refs),
    ...buildCardioMediaActions(state, createForm, editForm),
  };
}

function buildCardioPrimaryActions(
  state: ReturnType<typeof useCardioState>,
  createForm: ReturnType<typeof useCreateForm>,
  editForm: ReturnType<typeof useEditForm>,
  refs: ReturnType<typeof useCardioResources>,
) {
  return {
    onCancelDelete: () => state.setPendingDeleteId(''),
    onCloseCreateModal: () => state.setCreateModalVisible(false),
    onCloseEditModal: () => editForm.close(),
    onConfirmDelete: () => confirmCardioDelete(state, refs.deleteMutation.mutate),
    onCreate: () => createCardioItem(state, createForm, refs),
    onDelete: (itemId: string) => state.setPendingDeleteId(itemId),
    onEdit: (item: CardioMethodLibraryItem) => editForm.open(item),
    onOpenCreateModal: () => state.setCreateModalVisible(true),
    onSaveEdit: () => saveCardioEdit(editForm, refs.updateMutation.mutate),
    onSelectFilter: (id: string) => state.setActiveFilter(id || 'all'),
    onSetCreateField: createForm.setField,
    onSetEditField: editForm.setField,
    onToggleDetail: (itemId: string) =>
      state.setExpandedId(state.expandedId === itemId ? '' : itemId),
  };
}

function buildCardioMediaActions(
  state: ReturnType<typeof useCardioState>,
  createForm: ReturnType<typeof useCreateForm>,
  editForm: ReturnType<typeof useEditForm>,
) {
  return {
    onUploadCreateImage: () =>
      uploadLibraryMediaImage(
        createForm.uploadImageMutation,
        createForm.setField('imageUrl'),
        state.setCreateError,
      ),
    onUploadEditImage: () =>
      uploadLibraryMediaImage(
        editForm.uploadImageMutation,
        editForm.setField('imageUrl'),
        editForm.setEditError,
      ),
  };
}

function createCardioItem(
  state: ReturnType<typeof useCardioState>,
  createForm: ReturnType<typeof useCreateForm>,
  refs: ReturnType<typeof useCardioResources>,
): void {
  createCardio(
    state,
    createForm.form,
    refs.defaultTypeId,
    refs.createMutation.mutate,
    createForm.reset,
  );
}

function useCardioState() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [createError, setCreateError] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState('');
  const [query, setQuery] = useState('');
  return {
    activeFilter,
    createError,
    createModalVisible,
    deleteError,
    deletingId,
    expandedId,
    pendingDeleteId,
    query,
    setActiveFilter,
    setCreateError,
    setCreateModalVisible,
    setDeleteError,
    setDeletingId,
    setExpandedId,
    setPendingDeleteId,
    setQuery,
  };
}

function useCreateForm() {
  const [form, setForm] = useState<CardioCreateFormState>(EMPTY_CARDIO_FORM);
  const setField = createFieldSetter(setForm);
  return {
    form,
    reset: () => setForm(EMPTY_CARDIO_FORM),
    setField,
    uploadImageMutation: useUploadLibraryImageMutation(),
  };
}

function useEditForm() {
  const [editError, setEditError] = useState('');
  const [editingItem, setEditingItem] = useState<null | CardioMethodLibraryItem>(null);
  const [form, setForm] = useState<CardioCreateFormState>(EMPTY_CARDIO_FORM);
  const [visible, setVisible] = useState(false);
  const setField = createFieldSetter(setForm);
  return {
    close: () => setVisible(false),
    editError,
    editingItem,
    form,
    open: (item: CardioMethodLibraryItem) => {
      setEditingItem(item);
      setForm(toCardioForm(item));
      setEditError('');
      setVisible(true);
    },
    setEditError,
    setField,
    uploadImageMutation: useUploadLibraryImageMutation(),
    visible,
  };
}
