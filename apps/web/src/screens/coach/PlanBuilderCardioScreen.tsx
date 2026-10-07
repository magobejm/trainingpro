import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CardioIntervalEditor, ExercisePicker, type CardioIntervalDraft } from '@trainerpro/ui';
import '../../i18n';
import { useLibraryCardioMethodsQuery } from '../../data/hooks/useLibraryQuery';
import { useCreateCardioTemplateMutation, useUpdateCardioTemplateMutation } from '../../data/hooks/useCardioTemplates';
import { UnsavedStatus, UnsavedWorkDialogs } from '../../layout/UnsavedWorkDialogs';
import { saveTemplate } from '../../layout/template-save';
import { useUnsavedWork } from '../../layout/useUnsavedWork';

type MethodOption = {
  id: string;
  methodType: string;
  subtitle: string;
  title: string;
};

type CardioDraft = CardioIntervalDraft & {
  cardioMethodLibraryId: string;
  methodType: string;
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

export function PlanBuilderCardioScreen(): React.JSX.Element {
  const vm = useCardioBuilderViewModel();
  return (
    <>
      <UnsavedWorkDialogs
        onOverwrite={vm.onSave}
        onReload={() => {
          vm.work.release();
          window.location.reload();
        }}
        t={vm.t}
        work={vm.work}
      />
      <PlanBuilderCardioView {...vm} />
    </>
  );
}

function useCardioBuilderViewModel() {
  const { t } = useTranslation();
  const [templateName, setTemplateName] = useState('');
  const [intervals, setIntervals] = useState<CardioDraft[]>([]);
  const methodsQuery = useLibraryCardioMethodsQuery({ query: '' });
  const createTemplate = useCreateCardioTemplateMutation();
  const updateTemplate = useUpdateCardioTemplateMutation();
  const pickerItems = useMemo(() => mapMethodPicker(methodsQuery.data ?? []), [methodsQuery.data]);
  const snapshot = { intervals, templateName };
  const work = useUnsavedWork({
    onRestore: (value) => {
      setTemplateName(value.templateName);
      setIntervals(value.intervals);
    },
    storageKey: 'trainerpro.draft.cardio.new',
    value: snapshot,
  });
  const onSave = () => {
    const payload = buildPayload(templateName, intervals, t('coach.builder.dayTitleDefault'));
    void saveTemplate(work, null, (fields) => {
      const body = { ...payload, ...fields };
      return fields.templateId
        ? updateTemplate.mutateAsync({ ...body, templateId: fields.templateId })
        : createTemplate.mutateAsync(body);
    })
      .then(() => work.release({ intervals: [], templateName: '' }))
      .then(() => {
        setTemplateName('');
        setIntervals([]);
      })
      .catch(() => undefined);
  };
  return {
    intervals,
    isSaving: createTemplate.isPending || updateTemplate.isPending || work.saving,
    onAddMethod: (id: string) => setIntervals((state) => addMethod(state, id, pickerItems)),
    onAddPlaceholderBlock: () => setIntervals((state) => addFirstAvailable(state, pickerItems)),
    onChangeInterval: (index: number, next: CardioIntervalDraft) =>
      setIntervals((state) => replaceInterval(state, index, next)),
    onSave,
    pickerItems,
    setTemplateName,
    t,
    templateName,
    work,
  };
}

type ViewModel = ReturnType<typeof useCardioBuilderViewModel>;

function PlanBuilderCardioView(props: ViewModel) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{props.t('coach.builder.cardio.title')}</Text>
      <UnsavedStatus t={props.t} work={props.work} />
      <TemplateNameCard {...props} />
      <MethodPickerCard {...props} />
      <BlocksEditorCard {...props} />
      <Pressable
        disabled={props.isSaving}
        onPress={props.onSave}
        style={[styles.button, props.isSaving ? { opacity: 0.5 } : null]}
      >
        <Text style={styles.buttonLabel}>{props.t('coach.builder.save')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function TemplateNameCard(props: ViewModel) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.t('coach.builder.templateName')}</Text>
      <TextInput
        onChangeText={props.setTemplateName}
        placeholder={props.t('coach.builder.templateNamePlaceholder')}
        style={styles.input}
        value={props.templateName}
      />
    </View>
  );
}

function MethodPickerCard(props: ViewModel) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.t('coach.builder.cardio.pickMethod')}</Text>
      <ExercisePicker
        emptyLabel={props.t('coach.builder.emptyPicker')}
        items={props.pickerItems}
        onPick={props.onAddMethod}
        pickLabel={props.t('coach.builder.pickAction')}
      />
    </View>
  );
}

function BlocksEditorCard(props: ViewModel) {
  return (
    <View style={styles.card}>
      <CardioIntervalEditor
        addLabel={props.t('coach.builder.cardio.addBlock')}
        distanceLabel={props.t('coach.builder.cardio.distance')}
        emptyLabel={props.t('coach.builder.cardio.empty')}
        intervals={props.intervals}
        modeOptions={resolveModeOptions(props.t)}
        onAddInterval={props.onAddPlaceholderBlock}
        onChangeInterval={props.onChangeInterval}
        removeLabel={props.t('coach.builder.clearSet')}
        restLabel={props.t('coach.builder.cardio.rest')}
        roundsLabel={props.t('coach.builder.cardio.rounds')}
        rpeLabel={props.t('coach.builder.cardio.rpe')}
        workLabel={props.t('coach.builder.cardio.work')}
      />
    </View>
  );
}

function addMethod(state: CardioDraft[], id: string, options: MethodOption[]) {
  if (state.some((item) => item.cardioMethodLibraryId === id)) {
    return state;
  }
  const source = options.find((item) => item.id === id);
  if (!source) {
    return state;
  }
  return [...state, buildDraft(source)];
}

function addFirstAvailable(state: CardioDraft[], options: MethodOption[]) {
  const available = options.find((option) => !state.some((item) => item.cardioMethodLibraryId === option.id));
  if (!available) {
    return state;
  }
  return [...state, buildDraft(available)];
}

function replaceInterval(state: CardioDraft[], index: number, next: CardioIntervalDraft) {
  return state.map((item, idx) => (idx === index ? { ...item, ...next } : item));
}

function buildDraft(source: MethodOption): CardioDraft {
  return {
    cardioMethodLibraryId: source.id,
    displayName: source.title,
    distanceMode: 'CLIENT_INPUT',
    methodType: source.methodType,
    restSeconds: '30',
    roundsPlanned: '3',
    rpeMode: 'CLIENT_INPUT',
    targetDistanceMeters: '',
    targetRpe: '6',
    workSeconds: '45',
  };
}

function mapMethodPicker(items: { id: string; methodType: string; name: string }[]): MethodOption[] {
  return items.map((item) => ({
    id: item.id,
    methodType: item.methodType,
    subtitle: item.methodType,
    title: item.name,
  }));
}

function resolveModeOptions(t: (key: string) => string) {
  return [
    { label: t('coach.builder.mode.hidden'), value: 'HIDDEN' as const },
    { label: t('coach.builder.mode.coach'), value: 'COACH_INPUT' as const },
    { label: t('coach.builder.mode.client'), value: 'CLIENT_INPUT' as const },
  ];
}

function buildPayload(name: string, intervals: CardioDraft[], dayTitle: string) {
  return {
    days: [
      {
        cardioBlocks: intervals.map((item, index) => ({
          cardioMethodLibraryId: item.cardioMethodLibraryId,
          displayName: item.displayName,
          fieldModes: [
            { fieldKey: 'distance', mode: item.distanceMode },
            { fieldKey: 'rpe', mode: item.rpeMode },
          ],
          methodType: item.methodType,
          restSeconds: toNumber(item.restSeconds) ?? 0,
          roundsPlanned: toNumber(item.roundsPlanned) ?? 1,
          sortOrder: index,
          targetDistanceMeters: toNumber(item.targetDistanceMeters),
          targetRpe: toNumber(item.targetRpe),
          workSeconds: toNumber(item.workSeconds) ?? 1,
        })),
        dayIndex: 1,
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
  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    width: '100%',
  },
});
