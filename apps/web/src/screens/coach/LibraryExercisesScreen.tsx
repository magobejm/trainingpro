import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import {
  useCreateExerciseMutation,
  useDeleteExerciseMutation,
  useUpdateExerciseMutation,
  useUploadLibraryImageMutation,
} from '../../data/hooks/useLibraryMutations';
import {
  useLibraryExerciseMuscleGroupsQuery,
  useLibraryExercisesQuery,
  type ExerciseLibraryItem,
} from '../../data/hooks/useLibraryQuery';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { LibraryExercisesView } from './components/LibraryExercisesView';
import {
  EMPTY_EXERCISE_FORM,
  type ExerciseCreateFormState,
} from './LibraryExercisesScreen.create';
import {
  buildCatalogChips,
  buildExerciseInput,
  findDefaultCatalogId,
  onCreateExerciseSuccess,
  validateYoutube,
} from './LibraryExercisesScreen.helpers';
import { createFieldSetter } from './libraryCreateForm.utils';
import { toExerciseForm, toExerciseUpdatePayload } from './library-exercise.edit';
import { uploadLibraryMediaImage } from './library-media.upload';
export function LibraryExercisesScreen(): React.JSX.Element {
  const vm = useExercisesViewModel();
  return (
    <>
      <LibraryExercisesView {...vm} />
      <ActionConfirmModal
        cancelLabel={vm.t('coach.clients.modal.cancel')}
        confirmLabel={vm.t('coach.library.exercises.actions.delete')}
        message={vm.t('coach.library.exercises.actions.deleteConfirm')}
        onCancel={vm.onCancelDelete}
        onConfirm={vm.onConfirmDelete}
        title={vm.t('coach.library.confirm.title')}
        visible={Boolean(vm.pendingDeleteId)}
      />
    </>
  );
}
function useExercisesViewModel() {
  const { t } = useTranslation();
  const state = useExercisesState();
  const createForm = useCreateForm();
  const editForm = useEditForm();
  const refs = useExerciseResources(state);
  useDefaultExerciseCatalog(createForm, refs.defaultCatalogId);
  const chips = useMemo(() => buildCatalogChips(refs.catalogItems, t), [refs.catalogItems, t]);
  return buildExercisesViewModel(state, createForm, editForm, refs, chips, t);
}
function buildExercisesViewModel(
  state: ReturnType<typeof useExercisesState>,
  createForm: ReturnType<typeof useCreateForm>,
  editForm: ReturnType<typeof useEditForm>,
  refs: ReturnType<typeof useExerciseResources>,
  chips: Array<{ id: string; label: string }>,
  t: (key: string) => string,
) {
  return {
    ...buildExerciseViewState(state, createForm, editForm, refs, chips),
    ...buildExerciseActions(state, createForm, editForm, refs),
    pendingDeleteId: state.pendingDeleteId,
    query: state.query,
    setQuery: state.setQuery,
    t,
  };
}
function buildExerciseViewState(
  state: ReturnType<typeof useExercisesState>,
  createForm: ReturnType<typeof useCreateForm>,
  editForm: ReturnType<typeof useEditForm>,
  refs: ReturnType<typeof useExerciseResources>,
  chips: Array<{ id: string; label: string }>,
) {
  return {
    activeFilter: state.activeFilter,
    chips,
    createError: state.createError,
    createForm: createForm.form,
    createModalVisible: state.createModalVisible,
    createSubmitting: createForm.createMutation.isPending,
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
    muscleGroupOptions: refs.catalogItems,
  };
}
function useExerciseResources(state: ReturnType<typeof useExercisesState>) {
  const deleteMutation = useDeleteExerciseMutation();
  const updateMutation = useUpdateExerciseMutation();
  const catalogQuery = useLibraryExerciseMuscleGroupsQuery();
  const catalogItems = catalogQuery.data ?? [];
  const defaultCatalogId = findDefaultCatalogId(catalogItems);
  const muscleGroupId = state.activeFilter === 'all' ? undefined : state.activeFilter;
  const listQuery = useLibraryExercisesQuery({ muscleGroupId, query: state.query });
  return {
    catalogItems,
    defaultCatalogId,
    deleteMutation,
    listItems: listQuery.data ?? [],
    updateMutation,
  };
}
function useDefaultExerciseCatalog(
  createForm: ReturnType<typeof useCreateForm>,
  defaultCatalogId: string,
): void {
  useEffect(() => {
    if (defaultCatalogId && !createForm.form.muscleGroupId) {
      createForm.setField('muscleGroupId')(defaultCatalogId);
    }
  }, [createForm, defaultCatalogId]);
}
function buildExerciseActions(
  state: ReturnType<typeof useExercisesState>,
  createForm: ReturnType<typeof useCreateForm>,
  editForm: ReturnType<typeof useEditForm>,
  refs: ReturnType<typeof useExerciseResources>,
) {
  return {
    onCancelDelete: () => state.setPendingDeleteId(''),
    onCloseCreateModal: () => state.setCreateModalVisible(false),
    onCloseEditModal: () => editForm.close(),
    onConfirmDelete: () => confirmDelete(state, refs.deleteMutation),
    onCreate: () => createExercise(state, createForm, refs.defaultCatalogId),
    onDelete: (itemId: string) => state.setPendingDeleteId(itemId),
    onEdit: (item: ExerciseLibraryItem) => editForm.open(item),
    onOpenCreateModal: () => state.setCreateModalVisible(true),
    onSaveEdit: () => saveExerciseEdit(editForm, refs.updateMutation),
    onSelectFilter: (id: string) => state.setActiveFilter(id || 'all'),
    onSetCreateField: createForm.setField,
    onSetEditField: editForm.setField,
    onToggleDetail: (itemId: string) =>
      state.setExpandedId(state.expandedId === itemId ? '' : itemId),
    ...buildExerciseMediaActions(state, createForm, editForm),
  };
}
function buildExerciseMediaActions(
  state: ReturnType<typeof useExercisesState>,
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
function useExercisesState() {
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
  const [form, setForm] = useState<ExerciseCreateFormState>(EMPTY_EXERCISE_FORM);
  const setField = createFieldSetter(setForm);
  return {
    createMutation: useCreateExerciseMutation(),
    form,
    reset: () => setForm(EMPTY_EXERCISE_FORM),
    setField,
    uploadImageMutation: useUploadLibraryImageMutation(),
  };
}
function useEditForm() {
  const [editError, setEditError] = useState('');
  const [editingItem, setEditingItem] = useState<ExerciseLibraryItem | null>(null);
  const [form, setForm] = useState<ExerciseCreateFormState>(EMPTY_EXERCISE_FORM);
  const [visible, setVisible] = useState(false);
  const setField = createFieldSetter(setForm);
  return {
    close: () => setVisible(false),
    editError,
    editingItem,
    form,
    open: (item: ExerciseLibraryItem) => {
      setEditingItem(item);
      setForm(toExerciseForm(item));
      setEditError('');
      setVisible(true);
    },
    setEditError,
    setField,
    uploadImageMutation: useUploadLibraryImageMutation(),
    visible,
  };
}
function createExercise(
  state: ReturnType<typeof useExercisesState>,
  createForm: ReturnType<typeof useCreateForm>,
  defaultCatalogId: string,
): void {
  const normalizedName = createForm.form.name.trim();
  if (!normalizedName || !defaultCatalogId) {
    return;
  }
  const youtubeValidation = validateYoutube(createForm.form.youtubeUrl);
  if (youtubeValidation) {
    state.setCreateError(youtubeValidation);
    return;
  }
  state.setCreateError('');
  createForm.createMutation.mutate(
    buildExerciseInput(createForm.form, state.activeFilter, defaultCatalogId, normalizedName),
    {
      onError: (error) => state.setCreateError(error.message),
      onSuccess: () => onCreateExerciseSuccess(createForm.reset, state.setCreateModalVisible),
    },
  );
}
function saveExerciseEdit(
  editForm: ReturnType<typeof useEditForm>,
  updateMutation: ReturnType<typeof useUpdateExerciseMutation>,
): void {
  if (!editForm.editingItem) {
    return;
  }
  if (!editForm.form.name.trim()) {
    editForm.setEditError('coach.library.exercises.actions.editInvalid');
    return;
  }
  const youtubeValidation = validateYoutube(editForm.form.youtubeUrl);
  if (youtubeValidation) {
    editForm.setEditError(youtubeValidation);
    return;
  }
  editForm.setEditError('');
  updateMutation.mutate(
    {
      itemId: editForm.editingItem.id,
      payload: toExerciseUpdatePayload(editForm.editingItem, editForm.form),
    },
    {
      onError: (error) => editForm.setEditError(error.message),
      onSuccess: () => editForm.close(),
    },
  );
}
function confirmDelete(
  state: ReturnType<typeof useExercisesState>,
  mutation: ReturnType<typeof useDeleteExerciseMutation>,
): void {
  if (!state.pendingDeleteId) {
    return;
  }
  const itemId = state.pendingDeleteId;
  state.setPendingDeleteId('');
  state.setDeleteError('');
  state.setDeletingId(itemId);
  mutation.mutate(itemId, {
    onError: (error) => state.setDeleteError(error.message),
    onSettled: () => state.setDeletingId(''),
  });
}
