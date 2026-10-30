import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Modal, colors, fontSize, space, useToast } from '@trainerpro/ui';
import {
  cascadeCandidates,
  type CommandApplyResponse,
  type CommandVariable,
  type RoutineEditorResponse,
} from '@trainerpro/shared';
import '../../../../i18n';
import { useApplyProgression, useProgressionPresets } from '../../../../data/hooks/useRoutineProgression';
import { draftRules, emptyDrafts, isDirty, parseValue, toggleIn, type Drafts, type RuleDraft } from './progression-draft';
import { ProgressionPreviewPanel } from './ProgressionPreviewPanel';
import { ProgressionRulesPanel } from './ProgressionRulesPanel';
import { ProgressionSelector } from './ProgressionSelector';

type Translate = ReturnType<typeof useTranslation>['t'];

function CascadeQuestion(props: {
  count: number;
  onAnswer: (cascade: boolean) => void;
  onBack: () => void;
  t: Translate;
}): React.JSX.Element {
  const { t } = props;
  return (
    <Modal
      closeLabel={t('common.close')}
      onClose={props.onBack}
      size="sm"
      title={t('coach.clientRoutine.command.cascade.title')}
      visible
    >
      <View style={styles.stack}>
        <Text style={styles.text}>{t('coach.clientRoutine.command.cascade.body', { count: props.count })}</Text>
        <View style={styles.actions}>
          <Button label={t('coach.clientRoutine.command.cascade.yes')} onPress={() => props.onAnswer(true)} />
          <Button
            label={t('coach.clientRoutine.command.cascade.no')}
            onPress={() => props.onAnswer(false)}
            variant="secondary"
          />
          <Button label={t('coach.clientRoutine.command.cascade.back')} onPress={props.onBack} variant="ghost" />
        </View>
      </View>
    </Modal>
  );
}

function Footer(props: {
  canApply: boolean;
  confirmCancel: boolean;
  onApply: () => void;
  onCancel: () => void;
  onDiscard: () => void;
  onKeep: () => void;
  pending: boolean;
  t: Translate;
}): React.JSX.Element {
  const { t } = props;
  if (props.confirmCancel) {
    return (
      <View style={styles.actions}>
        <Text style={styles.text}>{t('coach.clientRoutine.command.discard')}</Text>
        <Button label={t('coach.clientRoutine.command.keepEditing')} onPress={props.onKeep} variant="secondary" />
        <Button label={t('common.cancel')} onPress={props.onDiscard} variant="danger" />
      </View>
    );
  }
  return (
    <View style={styles.actions}>
      <Button label={t('common.cancel')} onPress={props.onCancel} variant="secondary" />
      <Button
        disabled={!props.canApply}
        label={t('coach.clientRoutine.command.apply')}
        loading={props.pending}
        onPress={props.onApply}
      />
    </View>
  );
}

function summary(t: Translate, result: CommandApplyResponse): string {
  return t('coach.clientRoutine.command.done', { sets: result.changedSets, weeks: result.touchedWeeks });
}

export function ProgressionCommandModal(props: {
  clientId: string;
  onClose: () => void;
  response: RoutineEditorResponse;
}): React.JSX.Element {
  const { t } = useTranslation();
  const toast = useToast();
  const apply = useApplyProgression(props.clientId);
  const { add, presets, remove } = useProgressionPresets();
  const [weekIds, setWeekIds] = useState<string[]>([]);
  const [dayIndexes, setDayIndexes] = useState<number[]>([]);
  const [drafts, setDrafts] = useState<Drafts>(emptyDrafts);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [asking, setAsking] = useState(false);
  const open = useMemo(() => props.response.weeks.filter((week) => week.phase !== 'completed'), [props.response.weeks]);
  const selectedWeeks = open.filter((week) => weekIds.includes(week.id));
  const first = selectedWeeks[0] ?? null;
  const rules = draftRules(drafts);
  const dayChoices =
    (first ?? open[0])?.days.map((day) => ({
      dayIndex: day.dayIndex,
      label: day.title ?? t('coach.clientRoutine.command.day', { n: day.dayIndex + 1 }),
    })) ?? [];
  const cascade = cascadeCandidates(
    selectedWeeks.map((week) => week.weekIndex),
    open.map((week) => week.weekIndex),
  );

  const patch = (variable: CommandVariable, change: Partial<RuleDraft>) =>
    setDrafts((current) => ({ ...current, [variable]: { ...current[variable], ...change } }));
  const run = (withCascade: boolean) => {
    setAsking(false);
    apply.mutate(
      { cascade: withCascade, dayIndexes, rules, weekIds },
      {
        onError: () => toast.error(t('coach.clientRoutine.command.error')),
        onSuccess: (result) => {
          toast.success(summary(t, result));
          props.onClose();
        },
      },
    );
  };
  const savePreset = (variable: CommandVariable) => {
    const value = parseValue(drafts[variable].text);
    if (value != null) add.mutate({ mode: drafts[variable].mode, value, variable });
  };
  const requestClose = () => (isDirty(drafts) || weekIds.length > 0 ? setConfirmCancel(true) : props.onClose());

  return (
    <Modal
      closeLabel={t('common.close')}
      onClose={requestClose}
      size="xl"
      title={t('coach.clientRoutine.command.title')}
      visible
    >
      <View style={styles.stack}>
        {open.length === 0 ? (
          <Banner subtitle={t('coach.clientRoutine.command.noOpenWeeks')} title={t('coach.clientRoutine.command.title')} />
        ) : (
          <>
            <ProgressionSelector
              dayChoices={dayChoices}
              days={dayIndexes}
              onToggleAll={() => setWeekIds(selectedWeeks.length === open.length ? [] : open.map((week) => week.id))}
              onToggleDay={(index) => setDayIndexes((list) => toggleIn(list, index))}
              onToggleWeek={(id) => setWeekIds((list) => toggleIn(list, id))}
              selected={weekIds}
              t={t}
              weeks={open}
            />
            <View style={styles.columns}>
              <ProgressionRulesPanel
                drafts={drafts}
                onAddPreset={savePreset}
                onChange={patch}
                onRemovePreset={(id) => remove.mutate(id)}
                presets={presets}
                t={t}
              />
              <ProgressionPreviewPanel dayIndexes={dayIndexes} rules={rules} t={t} week={first} />
            </View>
            <Footer
              canApply={rules.length > 0 && selectedWeeks.length > 0}
              confirmCancel={confirmCancel}
              onApply={() => (cascade.shouldAsk ? setAsking(true) : run(false))}
              onCancel={requestClose}
              onDiscard={props.onClose}
              onKeep={() => setConfirmCancel(false)}
              pending={apply.isPending}
              t={t}
            />
          </>
        )}
      </View>
      {asking ? <CascadeQuestion count={cascade.later.length} onAnswer={run} onBack={() => setAsking(false)} t={t} /> : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'flex-end' },
  columns: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  stack: { gap: space.lg },
  text: { color: colors.text, fontSize: fontSize.sm },
});
