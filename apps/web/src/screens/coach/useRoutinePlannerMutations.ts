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
  mutateAsync: (input: UpsertRoutineInput) => Promise<{ id: string }>;
}

export function useRoutinePlannerMutations(
  draft: DraftState,
  editingId: string | null,
  setDraft: (d: DraftState) => void,
  setEditingId: (id: string | null) => void,
  setActiveDay: (i: number) => void,
  setSuccess: (v: boolean) => void,
  t: (k: string) => string,
  onAfterSave?: (templateId: string) => Promise<void> | void,
  dayPrefixKey = 'coach.routine.dayPrefix',
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
    onAfterSave,
    dayPrefixKey,
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
  onAfterSave?: (templateId: string) => Promise<void> | void;
  dayPrefixKey: string;
  updateMutation: MutationHandler;
  createMutation: MutationHandler;
}

function useOnSave(props: SaveProps) {
  const { draft, editingId, setDraft, setEditingId, setActiveDay, setSuccess, t, dayPrefixKey } =
    props;
  return useCallback(async () => {
    const payload = buildRoutinePayload(draft);
    const saved = editingId
      ? await props.updateMutation.mutateAsync(payload)
      : await props.createMutation.mutateAsync(payload);
    await props.onAfterSave?.(saved.id);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setDraft(createEmptyDraft(t, dayPrefixKey));
    setEditingId(null);
    setActiveDay(0);
  }, [
    draft,
    editingId,
    t,
    dayPrefixKey,
    props.updateMutation,
    props.createMutation,
    props.onAfterSave,
    setDraft,
    setEditingId,
    setActiveDay,
    setSuccess,
  ]);
}
