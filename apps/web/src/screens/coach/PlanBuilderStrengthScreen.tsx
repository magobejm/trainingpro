import { EmptyIllustration } from '../../components/EmptyIllustrations';
import React, { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  Button,
  EmptyState,
  ExercisePicker,
  IconButton,
  SetPrescriptionEditor,
  TextField,
  space,
  useToast,
} from '@trainerpro/ui';
import { ActionConfirmModal } from './components/ActionConfirmModal';
import { UnsavedStatus, UnsavedWorkDialogs } from '../../layout/UnsavedWorkDialogs';
import { usePlanBuilderViewModel } from './PlanBuilderStrengthScreen.state';
import { styles } from './PlanBuilderStrengthScreen.styles';
import '../../i18n';

const ICON_REMOVE = '×';

export function PlanBuilderStrengthScreen(): React.JSX.Element {
  const vm = usePlanBuilderViewModel();
  return (
    <>
      <UnsavedWorkDialogs
        onOverwrite={vm.onOverwrite}
        onReload={() => {
          vm.work.release();
          window.location.reload();
        }}
        t={vm.t}
        work={vm.work}
      />
      <PlanBuilderStrengthView {...vm} />
    </>
  );
}

type ViewModel = ReturnType<typeof usePlanBuilderViewModel>;

function PlanBuilderStrengthView(props: ViewModel): React.JSX.Element {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <UnsavedStatus t={props.t} work={props.work} />
      <BuilderHeader {...props} />
      <View style={styles.card}>
        <SelectedExerciseList {...props} />
      </View>
      <Button
        fullWidth
        label={props.currentTemplateId ? props.t('coach.clientProfile.save') : props.t('coach.builder.save')}
        loading={props.isSaving}
        onPress={props.onSaveTemplate}
      />
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
  const toast = useToast();
  const { saveSuccess, t } = props;
  useEffect(() => {
    if (saveSuccess) toast.success(t('coach.builder.saved'));
  }, [saveSuccess]);
  return (
    <>
      <Text style={styles.title}>{props.t('coach.builder.title')}</Text>
      <BuilderNameCard props={props} />
      <BuilderPickerCard props={props} />
    </>
  );
}

function BuilderNameCard({ props }: { props: ViewModel }) {
  return (
    <View style={styles.card}>
      <TextField
        label={props.t('coach.builder.templateName')}
        onChangeText={props.setTemplateName}
        placeholder={props.t('coach.builder.templateNamePlaceholder')}
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
    <View style={[styles.card, { marginTop: space.xl }]}>
      <Text style={styles.label}>{props.t('coach.builder.list.title')}</Text>
      {props.templates.length === 0 ? (
        <EmptyState icon={<EmptyIllustration kind={'generic'} />} title={props.t('coach.builder.list.empty')} />
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
        <Button
          label={props.t('coach.builder.list.edit')}
          onPress={() => props.onLoadTemplate(tpl)}
          size="sm"
          variant="secondary"
        />
        <Button
          label={props.t('coach.builder.list.delete')}
          onPress={() => props.onDeleteRequest(tpl.id)}
          size="sm"
          variant="danger"
        />
      </View>
    </View>
  );
}

function SelectedExerciseList(props: ViewModel): React.JSX.Element {
  if (props.selected.length === 0) {
    return <EmptyState icon={<EmptyIllustration kind={'generic'} />} title={props.t('coach.builder.emptySelected')} />;
  }
  return (
    <View style={styles.selectedList}>
      {props.selected.map((item) => (
        <SelectedExerciseItem key={item.id} item={item} props={props} />
      ))}
    </View>
  );
}

function SelectedExerciseItem({ item, props }: { item: ViewModel['selected'][0]; props: ViewModel }) {
  return (
    <View style={styles.exerciseCard}>
      <SelectedExerciseHeader item={item} onRemove={props.onRemoveExercise} t={props.t} />
      <SelectedExerciseEditor item={item} props={props} />
    </View>
  );
}

function SelectedExerciseHeader({
  item,
  onRemove,
  t,
}: {
  item: ViewModel['selected'][0];
  onRemove: (id: string) => void;
  t: ViewModel['t'];
}) {
  return (
    <View style={styles.exerciseHeader}>
      <Text style={styles.exerciseTitle}>{item.displayName}</Text>
      <IconButton
        accessibilityLabel={t('coach.builder.list.delete')}
        icon={(color) => <Text style={[styles.removeExerciseLabel, { color }]}>{ICON_REMOVE}</Text>}
        onPress={() => onRemove(item.id)}
        size={28}
        tone="danger"
      />
    </View>
  );
}

function getLabels(t: ViewModel['t']) {
  return {
    repsMax: t('coach.builder.global.repsMax', 'Reps máx'),
    repsMin: t('coach.builder.global.repsMin', 'Reps mín'),
    setsPlanned: t('coach.builder.global.sets', 'Series'),
    targetRir: t('coach.builder.global.rir', 'RIR'),
    targetRpe: t('coach.builder.global.rpe', 'RPE'),
  };
}

function SelectedExerciseEditor({ item, props }: { item: ViewModel['selected'][0]; props: ViewModel }) {
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
