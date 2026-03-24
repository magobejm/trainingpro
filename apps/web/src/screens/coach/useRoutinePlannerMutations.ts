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

  const onSaveCore = useOnSaveCore({ draft, editingId, updateMutation, createMutation });

  const onSave = useOnSave({
    onSaveCore,
    setDraft,
    setEditingId,
    setActiveDay,
    setSuccess,
    t,
    onAfterSave,
    dayPrefixKey,
  });

  return { onSave, onSaveCore, deleteMutation };
}

interface SaveCoreProps {
  draft: DraftState;
  editingId: string | null;
  updateMutation: MutationHandler;
  createMutation: MutationHandler;
}

function useOnSaveCore(props: SaveCoreProps) {
  const { draft, editingId } = props;
  return useCallback(
    async (name: string): Promise<string> => {
      const payload = { ...buildRoutinePayload(draft), name };
      const saved = editingId
        ? await props.updateMutation.mutateAsync(payload)
        : await props.createMutation.mutateAsync(payload);
      return saved.id;
    },
    [draft, editingId, props.updateMutation, props.createMutation],
  );
}

interface SaveProps {
  onSaveCore: (name: string) => Promise<string>;
  setDraft: (d: DraftState) => void;
  setEditingId: (id: string | null) => void;
  setActiveDay: (i: number) => void;
  setSuccess: (v: boolean) => void;
  t: (k: string) => string;
  onAfterSave?: (templateId: string) => Promise<void> | void;
  dayPrefixKey: string;
}

function useOnSave(props: SaveProps) {
  const { setDraft, setEditingId, setActiveDay, setSuccess, t, dayPrefixKey } = props;
  return useCallback(
    async (name: string) => {
      const savedId = await props.onSaveCore(name);
      await props.onAfterSave?.(savedId);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setDraft(createEmptyDraft(t, dayPrefixKey));
      setEditingId(null);
      setActiveDay(0);
    },
    [props.onSaveCore, props.onAfterSave, setDraft, setEditingId, setActiveDay, setSuccess, t, dayPrefixKey],
  );
}
