import type { CardioMethodWriteInput } from '../../data/hooks/useLibraryMutations';
import type { CardioMethodLibraryItem } from '../../data/hooks/useLibraryQuery';
import { toCardioPayload, type CardioCreateFormState } from './library-cardio.edit';
import { resolveCardioTypeId, validateCardioYoutube } from './library-cardio.helpers';

type StateShape = {
  activeFilter: string;
  pendingDeleteId: string;
  setCreateError: (value: string) => void;
  setCreateModalVisible: (value: boolean) => void;
  setDeleteError: (value: string) => void;
  setDeletingId: (value: string) => void;
  setPendingDeleteId: (value: string) => void;
};

type EditFormShape = {
  close: () => void;
  editingItem: CardioMethodLibraryItem | null;
  form: CardioCreateFormState;
  setEditError: (value: string) => void;
};

type MutationCallbacks = {
  onError: (error: Error) => void;
  onSuccess?: () => void;
  onSettled?: () => void;
};

type CreateMutate = (payload: CardioMethodWriteInput, callbacks: MutationCallbacks) => void;
type DeleteMutate = (itemId: string, callbacks: MutationCallbacks) => void;
type UpdateMutate = (
  payload: { itemId: string; payload: CardioMethodWriteInput },
  callbacks: MutationCallbacks,
) => void;

export function createCardio(
  state: StateShape,
  form: CardioCreateFormState,
  defaultTypeId: string,
  mutate: CreateMutate,
  reset: () => void,
): void {
  const name = form.name.trim();
  if (!name || !defaultTypeId) return;
  const youtubeValidation = validateCardioYoutube(form.youtubeUrl);
  if (youtubeValidation) {
    state.setCreateError(youtubeValidation);
    return;
  }
  state.setCreateError('');
  const methodTypeId = resolveCardioTypeId(form.methodTypeId, state.activeFilter, defaultTypeId);
  mutate(toCardioPayload(form, methodTypeId, name), {
    onError: (error) => state.setCreateError(error.message),
    onSuccess: () => {
      reset();
      state.setCreateModalVisible(false);
    },
  });
}

export function saveCardioEdit(editForm: EditFormShape, mutate: UpdateMutate): void {
  if (!editForm.editingItem) return;
  const name = editForm.form.name.trim();
  if (!name) {
    editForm.setEditError('coach.library.exercises.actions.editInvalid');
    return;
  }
  const youtubeValidation = validateCardioYoutube(editForm.form.youtubeUrl);
  if (youtubeValidation) {
    editForm.setEditError(youtubeValidation);
    return;
  }
  editForm.setEditError('');
  const methodTypeId = editForm.form.methodTypeId.trim() || editForm.editingItem.methodTypeId;
  mutate(
    {
      itemId: editForm.editingItem.id,
      payload: toCardioPayload(editForm.form, methodTypeId, name),
    },
    {
      onError: (error) => editForm.setEditError(error.message),
      onSuccess: () => editForm.close(),
    },
  );
}

export function confirmCardioDelete(state: StateShape, mutate: DeleteMutate): void {
  if (!state.pendingDeleteId) return;
  const itemId = state.pendingDeleteId;
  state.setPendingDeleteId('');
  state.setDeleteError('');
  state.setDeletingId(itemId);
  mutate(itemId, {
    onError: (error) => state.setDeleteError(error.message),
    onSettled: () => state.setDeletingId(''),
  });
}
