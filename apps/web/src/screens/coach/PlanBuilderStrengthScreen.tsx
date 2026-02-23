import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ExercisePicker, SetPrescriptionEditor } from '@trainerpro/ui';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { usePlanBuilderViewModel } from './PlanBuilderStrengthScreen.state';
import { styles } from './PlanBuilderStrengthScreen.styles';
import '../../i18n';

const INPUT_PROPS = {
  keyboardType: 'default' as const,
};

const ICON_REMOVE = '×';

export function PlanBuilderStrengthScreen(): React.JSX.Element {
  const vm = usePlanBuilderViewModel();
  return <PlanBuilderStrengthView {...vm} />;
}

type ViewModel = ReturnType<typeof usePlanBuilderViewModel>;

function PlanBuilderStrengthView(props: ViewModel): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <BuilderHeader {...props} />
      <View style={styles.card}>
        <SelectedExerciseList {...props} />
      </View>
      <Pressable onPress={props.onSaveTemplate} style={styles.button}>
        <Text style={styles.buttonLabel}>
          {props.currentTemplateId
            ? props.t('coach.clientProfile.save')
            : props.t('coach.builder.save')}
        </Text>
      </Pressable>
      <BuilderTemplateList {...props} />
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

function BuilderHeader(props: ViewModel): React.JSX.Element {
  return (
    <>
      <Text style={styles.title}>{props.t('coach.builder.title')}</Text>
      {props.saveSuccess && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{props.t('coach.builder.saved')}</Text>
        </View>
      )}
      <BuilderNameCard props={props} />
      <BuilderPickerCard props={props} />
    </>
  );
}

function BuilderNameCard({ props }: { props: ViewModel }) {
  return (
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
  );
}

function BuilderPickerCard({ props }: { props: ViewModel }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{props.t('coach.builder.pickExercise')}</Text>
      <ExercisePicker
        emptyLabel={props.t('coach.builder.emptyPicker')}
        items={props.pickerItems}
        onPick={props.onAddExercise}
        pickLabel={props.t('coach.builder.pickAction')}
      />
    </View>
  );
}

function BuilderTemplateList(props: ViewModel): React.JSX.Element {
  return (
    <View style={[styles.card, { marginTop: 24 }]}>
      <Text style={styles.label}>{props.t('coach.builder.list.title')}</Text>
      {props.templates.length === 0 ? (
        <Text style={styles.empty}>{props.t('coach.builder.list.empty')}</Text>
      ) : (
        <View style={styles.templateList}>
          {props.templates.map((tpl) => (
            <TemplateListItem key={tpl.id} props={props} tpl={tpl} />
          ))}
        </View>
      )}
    </View>
  );
}

function TemplateListItem({ props, tpl }: { props: ViewModel; tpl: ViewModel['templates'][0] }) {
  const count = tpl.days?.[0]?.exercises?.length || 0;
  return (
    <View style={styles.templateItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.templateName}>{tpl.name}</Text>
        <Text style={styles.templateMeta}>
          {props.t('coach.builder.list.exercisesCount', {
            count,
            defaultValue: `${count} exercises`,
          })}
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
  );
}

function SelectedExerciseList(props: ViewModel): React.JSX.Element {
  if (props.selected.length === 0) {
    return <Text style={styles.empty}>{props.t('coach.builder.emptySelected')}</Text>;
  }
  return (
    <View style={styles.selectedList}>
      {props.selected.map((item) => (
        <SelectedExerciseItem key={item.id} item={item} props={props} />
      ))}
    </View>
  );
}

function SelectedExerciseItem({
  item,
  props,
}: {
  item: ViewModel['selected'][0];
  props: ViewModel;
}) {
  return (
    <View style={styles.exerciseCard}>
      <SelectedExerciseHeader item={item} onRemove={props.onRemoveExercise} />
      <SelectedExerciseEditor item={item} props={props} />
    </View>
  );
}

function SelectedExerciseHeader({
  item,
  onRemove,
}: {
  item: ViewModel['selected'][0];
  onRemove: (id: string) => void;
}) {
  return (
    <View style={styles.exerciseHeader}>
      <Text style={styles.exerciseTitle}>{item.displayName}</Text>
      <Pressable onPress={() => onRemove(item.id)} style={styles.removeExerciseBtn}>
        <Text style={styles.removeExerciseLabel}>{ICON_REMOVE}</Text>
      </Pressable>
    </View>
  );
}

function getLabels(t: ViewModel['t']) {
  return {
    repsMax: t('coach.builder.global.repsMax', 'Reps máx'),
    repsMin: t('coach.builder.global.repsMin', 'Reps mín'),
    restSeconds: t('coach.builder.global.rest', 'Descanso (s)'),
    setsPlanned: t('coach.builder.global.sets', 'Series'),
    targetRir: t('coach.builder.global.rir', 'RIR'),
    targetRpe: t('coach.builder.global.rpe', 'RPE'),
  };
}

function SelectedExerciseEditor({
  item,
  props,
}: {
  item: ViewModel['selected'][0];
  props: ViewModel;
}) {
  return (
    <SetPrescriptionEditor
      addLabel={props.t('coach.builder.addSet')}
      globalModes={item.globalModes}
      globalValues={item.globalValues}
      labels={getLabels(props.t)}
      maxLabel={props.t('coach.builder.maxKg')}
      minLabel={props.t('coach.builder.minKg')}
      onAddSet={() => props.onAddRange(item.id)}
      onChangeGlobalMode={(f, m) => props.onChangeGlobalMode(item.id, f, m)}
      onChangeGlobalValue={(f, v) => props.onChangeGlobalValue(item.id, f, v)}
      onChangeRange={(idx, r) => props.onChangeRange(item.id, idx, r)}
      ranges={item.perSetRanges}
      removeLabel={props.t('coach.builder.clearSet')}
    />
  );
}
