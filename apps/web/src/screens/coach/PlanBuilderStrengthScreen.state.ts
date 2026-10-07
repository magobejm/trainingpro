import { useMemo, useState } from 'react';
import { saveTemplate } from '../../layout/template-save';
import { useUnsavedWork } from '../../layout/useUnsavedWork';
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
  const pickerItems = useMemo(() => mapPickerItems(exercisesQuery.data ?? []), [exercisesQuery.data]);
  const selection = useBuilderSelection(pickerItems);
  const ops = useTemplateOperations(store.currentTemplateId);

  return { ops, pickerItems, selection, store, templatesQuery };
}

type StrengthSnapshot = { name: string; selected: BuilderExercise[] };

function useTemplateSaveAction(
  ops: ReturnType<typeof useTemplateOperations>,
  store: ReturnType<typeof usePlanBuilderState>['store'],
  selection: ReturnType<typeof usePlanBuilderState>['selection'],
  t: (key: string) => string,
  work: ReturnType<typeof useUnsavedWork<StrengthSnapshot>>,
) {
  const onComplete = () => {
    ops.setSaveSuccess(true);
    setTimeout(() => ops.setSaveSuccess(false), 3000);
    const empty: StrengthSnapshot = { name: '', selected: [] };
    work.release(empty);
    store.resetDraft();
    selection.resetSelection();
  };
  return () => {
    const payload = buildTemplatePayload(store.draft.name, selection.selected, t('coach.builder.dayTitleDefault'));
    void saveTemplate(work, store.currentTemplateId, (fields) => {
      const body = { ...payload, ...fields };
      return fields.templateId ? ops.updateTemplate.mutateAsync(body) : ops.createTemplate.mutateAsync(body);
    })
      .then(onComplete)
      .catch(() => undefined);
  };
}

function useBuilderActions(
  ops: ReturnType<typeof useTemplateOperations>,
  store: ReturnType<typeof usePlanBuilderState>['store'],
  selection: ReturnType<typeof usePlanBuilderState>['selection'],
  t: (key: string) => string,
  work: ReturnType<typeof useUnsavedWork<StrengthSnapshot>>,
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
      const selected = mapTemplateToBuilder(template);
      store.startEditing(safeTpl.id, { days: safeTpl.days, name: safeTpl.name });
      selection.setSelection(selected);
      work.adopt({ name: String(safeTpl.name ?? ''), selected }, Number(safeTpl.templateVersion ?? 1));
    },
    onSaveTemplate: useTemplateSaveAction(ops, store, selection, t, work),
  };
}

export function usePlanBuilderViewModel() {
  const { t } = useTranslation();
  const { ops, pickerItems, selection, store, templatesQuery } = usePlanBuilderState();
  const snapshot: StrengthSnapshot = { name: store.draft.name, selected: selection.selected };
  const work = useUnsavedWork({
    onRestore: (value) => {
      store.setTemplateName(value.name);
      selection.setSelection(value.selected);
    },
    storageKey: `trainerpro.draft.strength.${store.currentTemplateId ?? 'new'}`,
    value: snapshot,
  });
  const actions = useBuilderActions(ops, store, selection, t, work);

  return {
    ...selection,
    currentTemplateId: store.currentTemplateId,
    deleteIsPending: ops.deleteTemplateMutation.isPending,
    deletingId: ops.deletingId,
    isSaving: ops.createTemplate.isPending || ops.updateTemplate.isPending || work.saving,
    onDeleteConfirm: actions.onDeleteConfirm,
    onDeleteRequest: ops.setDeletingId,
    onLoadTemplate: actions.onLoadTemplate,
    onOverwrite: actions.onSaveTemplate,
    onSaveTemplate: actions.onSaveTemplate,
    pickerItems,
    saveSuccess: ops.saveSuccess,
    setDeletingId: ops.setDeletingId,
    setTemplateName: store.setTemplateName,
    t,
    templateName: store.draft.name,
    templates: templatesQuery.data ?? [],
    work,
  };
}

function updateGlobalMode(s: BuilderExercise[], id: string, f: keyof BuilderExercise['globalModes'], m: FieldModeValue) {
  return s.map((i) => {
    if (i.id !== id) return i;
    return { ...i, globalModes: { ...i.globalModes, [f]: m } };
  });
}

function updateGlobalValue(s: BuilderExercise[], id: string, f: keyof BuilderExercise['globalValues'], v: string) {
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
