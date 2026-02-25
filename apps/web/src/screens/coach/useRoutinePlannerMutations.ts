import { useCallback } from 'react';
import {
  useCreateRoutineTemplateMutation,
  useUpdateRoutineTemplateMutation,
  useDeleteRoutineTemplateMutation,
  type UpsertRoutineInput,
} from '../../data/hooks/useRoutineTemplates';
import { buildRoutinePayload, createEmptyDraft } from './RoutinePlanner.helpers';
import type { DraftState } from './RoutinePlanner.types';

interface MutationHandler {
  mutate: (input: UpsertRoutineInput, options?: { onSuccess?: () => void }) => void;
}

export function useRoutinePlannerMutations(
  draft: DraftState,
  editingId: string | null,
  setDraft: (d: DraftState) => void,
  setEditingId: (id: string | null) => void,
  setActiveDay: (i: number) => void,
  setSuccess: (v: boolean) => void,
  t: (k: string) => string,
) {
  const createMutation = useCreateRoutineTemplateMutation();
  const updateMutation = useUpdateRoutineTemplateMutation(editingId ?? '');
  const deleteMutation = useDeleteRoutineTemplateMutation();

  const onSave = useOnSave({
    draft,
    editingId,
    setDraft,
    setEditingId,
    setActiveDay,
    setSuccess,
    t,
    updateMutation,
    createMutation,
  });

  return { onSave, deleteMutation };
}

interface SaveProps {
  draft: DraftState;
  editingId: string | null;
  setDraft: (d: DraftState) => void;
  setEditingId: (id: string | null) => void;
  setActiveDay: (i: number) => void;
  setSuccess: (v: boolean) => void;
  t: (k: string) => string;
  updateMutation: MutationHandler;
  createMutation: MutationHandler;
}

function useOnSave(props: SaveProps) {
  const { draft, editingId, setDraft, setEditingId, setActiveDay, setSuccess, t } = props;
  return useCallback(() => {
    const onSuccess = () => {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setDraft(createEmptyDraft(t));
      setEditingId(null);
      setActiveDay(0);
    };
    const payload = buildRoutinePayload(draft);
    if (editingId) {
      props.updateMutation.mutate(payload, { onSuccess });
    } else {
      props.createMutation.mutate(payload, { onSuccess });
    }
  }, [
    draft,
    editingId,
    t,
    props.updateMutation,
    props.createMutation,
    setDraft,
    setEditingId,
    setActiveDay,
    setSuccess,
  ]);
}
