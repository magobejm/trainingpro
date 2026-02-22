import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ExercisePicker,
  FieldModeControl,
  SetPrescriptionEditor,
  type FieldModeValue,
  type SetRange,
} from '@trainerpro/ui';
import '../../i18n';
import { useLibraryExercisesQuery } from '../../data/hooks/useLibraryQuery';
import {
  useCreatePlanTemplateMutation,
  useDeletePlanTemplateMutation,
  usePlanTemplatesQuery,
  useUpdatePlanTemplateMutation,
} from '../../data/hooks/usePlanTemplates';
import { usePlanBuilderStore } from '../../store/planBuilder.store';
import { ActionConfirmModal } from './components/ActionConfirmModal';

type BuilderExercise = {
  displayName: string;
  exerciseLibraryId: string;
  fieldMode: FieldModeValue;
  id: string;
  perSetRanges: SetRange[];
};

const COLORS = {
  action: '#225fdb',
  bg: '#edf3fb',
  card: '#ffffff',
  input: '#f3f7fd',
  muted: '#627285',
  text: '#0e1a2f',
  white: '#ffffff',
};

const INPUT_PROPS = {
  keyboardType: 'default' as const,
};

export function PlanBuilderStrengthScreen(): React.JSX.Element {
  const vm = usePlanBuilderViewModel();
  return <PlanBuilderStrengthView {...vm} />;
}

function usePlanBuilderViewModel() {
  const { t } = useTranslation();
  const draft = usePlanBuilderStore((state) => state.draft);
  const currentTemplateId = usePlanBuilderStore((state) => state.currentTemplateId);
  const setTemplateName = usePlanBuilderStore((state) => state.setTemplateName);
  const resetDraft = usePlanBuilderStore((state) => state.resetDraft);
  const startEditing = usePlanBuilderStore((state) => state.startEditing);

  const createTemplate = useCreatePlanTemplateMutation();
  const updateTemplate = useUpdatePlanTemplateMutation(currentTemplateId ?? '');
  const deleteTemplateMutation = useDeletePlanTemplateMutation();
  const templatesQuery = usePlanTemplatesQuery();

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<null | string>(null);

  const exercisesQuery = useLibraryExercisesQuery({ query: '' });
  const pickerItems = useMemo(
    () => mapPickerItems(exercisesQuery.data ?? []),
    [exercisesQuery.data],
  );

  const selection = useBuilderSelection(pickerItems);

  const onSaveTemplate = () => {
    const payload = buildTemplatePayload(
      draft.name,
      selection.selected,
      t('coach.builder.dayTitleDefault'),
    );

    const onComplete = () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      resetDraft();
      selection.resetSelection();
    };

    if (currentTemplateId) {
      updateTemplate.mutate(payload, { onSuccess: onComplete });
    } else {
      createTemplate.mutate(payload, { onSuccess: onComplete });
    }
  };

  const onLoadTemplate = (template: any) => {
    const builderDraft = mapTemplateToBuilder(template, pickerItems);
    startEditing(template.id, { name: template.name, days: template.days });
    selection.setSelection(builderDraft);
  };

  const onDeleteConfirm = () => {
    if (deletingId) {
      deleteTemplateMutation.mutate(deletingId, {
        onSettled: () => setDeletingId(null),
      });
    }
  };

  return {
    ...selection,
    currentTemplateId,
    deletingId,
    deleteIsPending: deleteTemplateMutation.isPending,
    onDeleteConfirm,
    onDeleteRequest: setDeletingId,
    onLoadTemplate,
    onSaveTemplate,
    pickerItems,
    saveSuccess,
    setDeletingId,
    setTemplateName,
    t,
    templateName: draft.name,
    templates: templatesQuery.data ?? [],
  };
}

type ViewModel = ReturnType<typeof usePlanBuilderViewModel>;

function PlanBuilderStrengthView(props: ViewModel): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{props.t('coach.builder.title')}</Text>

      {props.saveSuccess && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{props.t('coach.builder.saved')}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>{props.t('coach.builder.templateName')}</Text>
        <TextInput
          {...INPUT_PROPS}
          onChangeText={props.setTemplateName}
          placeholder={props.t('coach.builder.templateNamePlaceholder')}
          style={styles.input}
          value={props.templateName}
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>{props.t('coach.builder.pickExercise')}</Text>
        <ExercisePicker
          emptyLabel={props.t('coach.builder.emptyPicker')}
          items={props.pickerItems}
          onPick={props.onAddExercise}
          pickLabel={props.t('coach.builder.pickAction')}
        />
      </View>
      <View style={styles.card}>{renderSelected(props)}</View>
      <Pressable onPress={props.onSaveTemplate} style={styles.button}>
        <Text style={styles.buttonLabel}>
          {props.currentTemplateId ? props.t('coach.clientProfile.save') : props.t('coach.builder.save')}
        </Text>
      </Pressable>

      <View style={[styles.card, { marginTop: 24 }]}>
        <Text style={styles.label}>{props.t('coach.builder.list.title')}</Text>
        {props.templates.length === 0 ? (
          <Text style={styles.empty}>{props.t('coach.builder.list.empty')}</Text>
        ) : (
          <View style={styles.templateList}>
            {props.templates.map((tpl) => (
              <View key={tpl.id} style={styles.templateItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.templateName}>{tpl.name}</Text>
                  <Text style={styles.templateMeta}>
                    {tpl.days?.[0]?.exercises?.length || 0} exercises
                  </Text>
                </View>
                <View style={styles.templateActions}>
                  <Pressable onPress={() => props.onLoadTemplate(tpl)} style={styles.editAction}>
                    <Text style={styles.editActionLabel}>{props.t('coach.builder.list.edit')}</Text>
                  </Pressable>
                  <Pressable onPress={() => props.onDeleteRequest(tpl.id)} style={styles.deleteAction}>
                    <Text style={styles.deleteActionLabel}>{props.t('coach.builder.list.delete')}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <ActionConfirmModal
        cancelLabel={props.t('coach.builder.delete.cancel')}
        confirmLabel={props.t('coach.builder.delete.action')}
        isLoading={props.deleteIsPending}
        message={props.t('coach.builder.delete.confirm')}
        onCancel={() => props.setDeletingId(null)}
        onConfirm={props.onDeleteConfirm}
        title={props.t('coach.builder.delete.title')}
        visible={!!props.deletingId}
      />
    </ScrollView>
  );
}

function renderSelected(props: ViewModel): React.JSX.Element {
  if (props.selected.length === 0) {
    return <Text style={styles.empty}>{props.t('coach.builder.emptySelected')}</Text>;
  }
  return (
    <View style={styles.selectedList}>
      {props.selected.map((item) => (
        <View key={item.id} style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseTitle}>{item.displayName}</Text>
            <Pressable onPress={() => props.onRemoveExercise(item.id)} style={styles.removeExerciseBtn}>
              <Text style={styles.removeExerciseLabel}>×</Text>
            </Pressable>
          </View>
          <FieldModeControl
            onChange={(mode) => props.onFieldModeChange(item.id, mode)}
            options={resolveModeOptions(props.t)}
            value={item.fieldMode}
          />
          <SetPrescriptionEditor
            addLabel={props.t('coach.builder.addSet')}
            maxLabel={props.t('coach.builder.maxKg')}
            minLabel={props.t('coach.builder.minKg')}
            onAddSet={() => props.onAddRange(item.id)}
            onChangeRange={(index, range) => props.onChangeRange(item.id, index, range)}
            ranges={item.perSetRanges}
            removeLabel={props.t('coach.builder.clearSet')}
          />
        </View>
      ))}
    </View>
  );
}

function useBuilderSelection(pickerItems: { id: string; title: string }[]) {
  const [selected, setSelected] = useState<BuilderExercise[]>([]);
  const onAddExercise = (id: string) => {
    setSelected((state) => addExercise(state, id, pickerItems));
  };
  const onFieldModeChange = (id: string, mode: FieldModeValue) => {
    setSelected((state) => state.map((item) => updateFieldMode(item, id, mode)));
  };
  const onAddRange = (id: string) => {
    setSelected((state) => state.map((item) => appendRange(item, id)));
  };
  const onChangeRange = (id: string, index: number, range: SetRange) => {
    setSelected((state) => state.map((item) => replaceRange(item, id, index, range)));
  };
  const onRemoveExercise = (id: string) => {
    setSelected((state) => state.filter((item) => item.id !== id));
  };
  const resetSelection = () => setSelected([]);
  const setSelection = (items: BuilderExercise[]) => setSelected(items);

  return {
    onAddExercise,
    onAddRange,
    onChangeRange,
    onFieldModeChange,
    onRemoveExercise,
    resetSelection,
    selected,
    setSelection,
  };
}

function resolveModeOptions(t: (key: string) => string) {
  return [
    { label: t('coach.builder.mode.hidden'), value: 'HIDDEN' as const },
    { label: t('coach.builder.mode.coach'), value: 'COACH_INPUT' as const },
    { label: t('coach.builder.mode.client'), value: 'CLIENT_INPUT' as const },
  ];
}

function appendRange(item: BuilderExercise, id: string): BuilderExercise {
  if (item.id !== id) {
    return item;
  }
  return { ...item, perSetRanges: [...item.perSetRanges, { maxKg: '', minKg: '' }] };
}

function replaceRange(
  item: BuilderExercise,
  id: string,
  index: number,
  range: SetRange,
): BuilderExercise {
  if (item.id !== id) {
    return item;
  }
  const next = item.perSetRanges.map((entry, idx) => (idx === index ? range : entry));
  return { ...item, perSetRanges: next };
}

function addExercise(
  state: BuilderExercise[],
  id: string,
  pickerItems: { id: string; title: string }[],
) {
  if (state.some((item) => item.id === id)) {
    return state;
  }
  const source = pickerItems.find((item) => item.id === id);
  if (!source) {
    return state;
  }
  return [...state, buildBuilderExercise(source, id)];
}

function buildBuilderExercise(source: { title: string }, id: string): BuilderExercise {
  return {
    displayName: source.title,
    exerciseLibraryId: id,
    fieldMode: 'COACH_INPUT',
    id,
    perSetRanges: [],
  };
}

function mapPickerItems(items: { id: string; muscleGroup: string; name: string }[]) {
  return items.map((item) => ({ id: item.id, subtitle: item.muscleGroup, title: item.name }));
}

function updateFieldMode(item: BuilderExercise, id: string, mode: FieldModeValue) {
  return item.id === id ? { ...item, fieldMode: mode } : item;
}

function buildTemplatePayload(name: string, selected: BuilderExercise[], dayTitle: string) {
  return {
    days: [
      {
        dayIndex: 1,
        exercises: selected.map((item, index) => ({
          displayName: item.displayName,
          exerciseLibraryId: item.exerciseLibraryId,
          fieldModes: [{ fieldKey: 'weight', mode: item.fieldMode }],
          perSetWeightRanges: item.perSetRanges.map((range) => ({
            maxKg: toNumber(range.maxKg),
            minKg: toNumber(range.minKg),
          })),
          sortOrder: index,
          weightRangeMaxKg: null,
          weightRangeMinKg: null,
        })),
        title: dayTitle,
      },
    ],
    name,
  };
}

function toNumber(value: string | null | undefined): null | number {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapTemplateToBuilder(template: any, pickerItems: { id: string; title: string }[]): BuilderExercise[] {
  const day = template.days?.[0];
  if (!day) return [];

  return day.exercises.map((ex: any) => ({
    displayName: ex.displayName,
    exerciseLibraryId: ex.exerciseLibraryId || ex.id,
    fieldMode: ex.fieldModes?.[0]?.mode || 'COACH_INPUT',
    id: ex.exerciseLibraryId || ex.id,
    perSetRanges: (ex.prescription?.perSetWeightRanges || ex.perSetWeightRanges || []).map((r: any) => ({
      maxKg: String(r.maxKg ?? ''),
      minKg: String(r.minKg ?? ''),
    })),
  }));
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: COLORS.action,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 20,
  },
  buttonLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    gap: 10,
    padding: 14,
    width: '100%',
  },
  empty: {
    color: COLORS.muted,
    fontSize: 14,
  },
  exerciseCard: {
    borderColor: '#dce5f2',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 10,
  },
  exerciseTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    backgroundColor: COLORS.input,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  page: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: 12,
    minHeight: '100%',
    padding: 24,
  },
  selectedList: {
    gap: 10,
  },
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    width: '100%',
  },
  exerciseHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  removeExerciseBtn: {
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  removeExerciseLabel: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '800',
    marginTop: -2,
  },
  successBanner: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    width: '100%',
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  templateList: {
    gap: 12,
    marginTop: 8,
  },
  templateItem: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 12,
  },
  templateName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  templateMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  templateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editAction: {
    backgroundColor: '#e0f2fe',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editActionLabel: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteAction: {
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteActionLabel: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
});
