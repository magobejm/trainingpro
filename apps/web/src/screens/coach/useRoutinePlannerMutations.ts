import { useCallback, useRef } from 'react';
import {
  useCreateRoutineTemplateMutation,
  useUpdateRoutineTemplateMutation,
  useDeleteRoutineTemplateMutation,
  type UpsertRoutineInput,
} from '../../data/hooks/useRoutineTemplates';
import { saveTemplate } from '../../layout/template-save';
import type { SaveTarget } from '../../layout/unsaved-work';
import { buildRoutinePayload, createEmptyDraft } from './RoutinePlanner.helpers';
import type { DraftState } from './RoutinePlanner.types';

type SaveSession = {
  beginSave: () => void;
  endSave: () => void;
  release: (nextClean?: DraftState) => void;
  rememberCreated: (created: { id: string; templateVersion?: number }, clientSaveId: string) => void;
  reportConflict: (version: number | null) => void;
  resolveTarget: (editingId: string | null) => SaveTarget;
};

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
  session?: SaveSession,
) {
  const createMutation = useCreateRoutineTemplateMutation();
  const updateMutation = useUpdateRoutineTemplateMutation(editingId ?? '');
  const deleteMutation = useDeleteRoutineTemplateMutation();

  const onSaveCore = useOnSaveCore({ draft, editingId, updateMutation, createMutation, session });

  const lastSaveName = useRef('');
  const onSave = useOnSave({
    onSaveCore,
    setDraft,
    setEditingId,
    setActiveDay,
    setSuccess,
    t,
    onAfterSave,
    dayPrefixKey,
    session,
  });
  const trackedSave = useCallback(
    async (name: string) => {
      lastSaveName.current = name;
      await onSave(name);
    },
    [onSave],
  );
  const retrySave = useCallback(() => trackedSave(lastSaveName.current), [trackedSave]);

  return {
    deleteMutation,
    isSaving: createMutation.isPending || updateMutation.isPending,
    onSave: trackedSave,
    onSaveCore,
    retrySave,
  };
}

interface SaveCoreProps {
  createMutation: MutationHandler;
  draft: DraftState;
  editingId: string | null;
  session?: SaveSession;
  updateMutation: MutationHandler;
}

function useOnSaveCore(props: SaveCoreProps) {
  const { draft, editingId, session } = props;
  return useCallback(
    async (name: string): Promise<string> => {
      const payload = { ...buildRoutinePayload(draft), name };
      if (!session) {
        const saved = editingId
          ? await props.updateMutation.mutateAsync(payload)
          : await props.createMutation.mutateAsync(payload);
        return saved.id;
      }
      const saved = await saveTemplate(session, editingId, (fields) => {
        const body: UpsertRoutineInput = { ...payload, ...fields };
        return fields.templateId ? props.updateMutation.mutateAsync(body) : props.createMutation.mutateAsync(body);
      });
      return saved.id;
    },
    [draft, editingId, props.updateMutation, props.createMutation, session],
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
  session?: SaveSession;
}

function useOnSave(props: SaveProps) {
  const { setDraft, setEditingId, setActiveDay, setSuccess, t, dayPrefixKey, session } = props;
  return useCallback(
    async (name: string) => {
      const savedId = await props.onSaveCore(name);
      const empty = createEmptyDraft(t, dayPrefixKey);
      session?.release(empty);
      await props.onAfterSave?.(savedId);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setDraft(empty);
      setEditingId(null);
      setActiveDay(0);
    },
    [props.onSaveCore, props.onAfterSave, setDraft, setEditingId, setActiveDay, setSuccess, t, dayPrefixKey, session],
  );
}
