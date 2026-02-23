import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLibraryExercisesQuery } from '../../data/hooks/useLibraryQuery';
import {
  useCreatePlanTemplateMutation,
  useDeletePlanTemplateMutation,
  usePlanTemplatesQuery,
  useUpdatePlanTemplateMutation,
} from '../../data/hooks/usePlanTemplates';
import { usePlanBuilderStore } from '../../store/planBuilder.store';
import {
  addExercise,
  appendRange,
  buildTemplatePayload,
  mapPickerItems,
  mapTemplateToBuilder,
  replaceRange,
} from './PlanBuilderStrengthScreen.helpers';
import type { BuilderExercise } from './PlanBuilderStrengthScreen.types';
import type { FieldModeValue, SetRange } from '@trainerpro/ui';

function useTemplateOperations(currentTemplateId: string | null) {
  const createTemplate = useCreatePlanTemplateMutation();
  const updateTemplate = useUpdatePlanTemplateMutation(currentTemplateId ?? '');
  const deleteTemplateMutation = useDeletePlanTemplateMutation();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<null | string>(null);
  return {
    createTemplate,
    deleteTemplateMutation,
    deletingId,
    saveSuccess,
    setDeletingId,
    setSaveSuccess,
    updateTemplate,
  };
}

export function usePlanBuilderState() {
  const store = {
    currentTemplateId: usePlanBuilderStore((state) => state.currentTemplateId),
    draft: usePlanBuilderStore((state) => state.draft),
    resetDraft: usePlanBuilderStore((state) => state.resetDraft),
    setTemplateName: usePlanBuilderStore((state) => state.setTemplateName),
    startEditing: usePlanBuilderStore((state) => state.startEditing),
  };
  const templatesQuery = usePlanTemplatesQuery();
  const exercisesQuery = useLibraryExercisesQuery({ query: '' });
  const pickerItems = useMemo(
    () => mapPickerItems(exercisesQuery.data ?? []),
    [exercisesQuery.data],
  );
  const selection = useBuilderSelection(pickerItems);
  const ops = useTemplateOperations(store.currentTemplateId);

  return { ops, pickerItems, selection, store, templatesQuery };
}

function useTemplateSaveAction(
  ops: ReturnType<typeof useTemplateOperations>,
  store: ReturnType<typeof usePlanBuilderState>['store'],
  selection: ReturnType<typeof usePlanBuilderState>['selection'],
  t: (key: string) => string,
) {
  const onComplete = () => {
    ops.setSaveSuccess(true);
    setTimeout(() => ops.setSaveSuccess(false), 3000);
    store.resetDraft();
    selection.resetSelection();
  };
  return () => {
    const payload = buildTemplatePayload(
      store.draft.name,
      selection.selected,
      t('coach.builder.dayTitleDefault'),
    );
    if (store.currentTemplateId) {
      ops.updateTemplate.mutate(payload, { onSuccess: onComplete });
    } else {
      ops.createTemplate.mutate(payload, { onSuccess: onComplete });
    }
  };
}

function useBuilderActions(
  ops: ReturnType<typeof useTemplateOperations>,
  store: ReturnType<typeof usePlanBuilderState>['store'],
  selection: ReturnType<typeof usePlanBuilderState>['selection'],
  t: (key: string) => string,
) {
  return {
    onDeleteConfirm: () => {
      if (ops.deletingId) {
        ops.deleteTemplateMutation.mutate(ops.deletingId, {
          onSettled: () => ops.setDeletingId(null),
        });
      }
    },
    onLoadTemplate: (template: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safeTpl = template as any;
      store.startEditing(safeTpl.id, { days: safeTpl.days, name: safeTpl.name });
      selection.setSelection(mapTemplateToBuilder(template));
    },
    onSaveTemplate: useTemplateSaveAction(ops, store, selection, t),
  };
}

export function usePlanBuilderViewModel() {
  const { t } = useTranslation();
  const { ops, pickerItems, selection, store, templatesQuery } = usePlanBuilderState();
  const actions = useBuilderActions(ops, store, selection, t);

  return {
    ...selection,
    currentTemplateId: store.currentTemplateId,
    deleteIsPending: ops.deleteTemplateMutation.isPending,
    deletingId: ops.deletingId,
    onDeleteConfirm: actions.onDeleteConfirm,
    onDeleteRequest: ops.setDeletingId,
    onLoadTemplate: actions.onLoadTemplate,
    onSaveTemplate: actions.onSaveTemplate,
    pickerItems,
    saveSuccess: ops.saveSuccess,
    setDeletingId: ops.setDeletingId,
    setTemplateName: store.setTemplateName,
    t,
    templateName: store.draft.name,
    templates: templatesQuery.data ?? [],
  };
}

function updateGlobalMode(
  s: BuilderExercise[],
  id: string,
  f: keyof BuilderExercise['globalModes'],
  m: FieldModeValue,
) {
  return s.map((i) => {
    if (i.id !== id) return i;
    return { ...i, globalModes: { ...i.globalModes, [f]: m } };
  });
}

function updateGlobalValue(
  s: BuilderExercise[],
  id: string,
  f: keyof BuilderExercise['globalValues'],
  v: string,
) {
  return s.map((i) => {
    if (i.id !== id) return i;
    return { ...i, globalValues: { ...i.globalValues, [f]: v } };
  });
}

export function useBuilderSelection(pickerItems: { id: string; title: string }[]) {
  const [selected, setSelected] = useState<BuilderExercise[]>([]);
  return {
    onAddExercise: (id: string) => setSelected((s) => addExercise(s, id, pickerItems)),
    onAddRange: (id: string) => setSelected((s) => s.map((i) => appendRange(i, id))),
    onChangeGlobalMode: (id: string, f: keyof BuilderExercise['globalModes'], m: FieldModeValue) =>
      setSelected((s) => updateGlobalMode(s, id, f, m)),
    onChangeGlobalValue: (id: string, f: keyof BuilderExercise['globalValues'], v: string) =>
      setSelected((s) => updateGlobalValue(s, id, f, v)),
    onChangeRange: (id: string, idx: number, r: SetRange) => {
      setSelected((s) => s.map((i) => replaceRange(i, id, idx, r)));
    },
    onRemoveExercise: (id: string) => setSelected((s) => s.filter((i) => i.id !== id)),
    resetSelection: () => setSelected([]),
    selected,
    setSelection: setSelected,
  };
}
