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
import { useCreatePlanTemplateMutation } from '../../data/hooks/usePlanTemplates';
import { usePlanBuilderStore } from '../../store/planBuilder.store';

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
  const templateName = usePlanBuilderStore((state) => state.draft.name);
  const setTemplateName = usePlanBuilderStore((state) => state.setTemplateName);
  const createTemplate = useCreatePlanTemplateMutation();
  const exercisesQuery = useLibraryExercisesQuery({ query: '' });
  const pickerItems = useMemo(
    () => mapPickerItems(exercisesQuery.data ?? []),
    [exercisesQuery.data],
  );
  const selection = useBuilderSelection(pickerItems);
  const onSaveTemplate = () => {
    createTemplate.mutate(
      buildTemplatePayload(templateName, selection.selected, t('coach.builder.dayTitleDefault')),
    );
  };
  return {
    ...selection,
    onSaveTemplate,
    pickerItems,
    setTemplateName,
    t,
    templateName,
  };
}

type ViewModel = ReturnType<typeof usePlanBuilderViewModel>;

function PlanBuilderStrengthView(props: ViewModel): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{props.t('coach.builder.title')}</Text>
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
        <Text style={styles.buttonLabel}>{props.t('coach.builder.save')}</Text>
      </Pressable>
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
          <Text style={styles.exerciseTitle}>{item.displayName}</Text>
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
  return { onAddExercise, onAddRange, onChangeRange, onFieldModeChange, selected };
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

function toNumber(value: string): null | number {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
});
