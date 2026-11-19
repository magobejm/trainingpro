import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Banner, Button, Modal, colors, fontSize, space, useToast } from '@trainerpro/ui';
import {
  cascadeCandidates,
  type CommandApplyResponse,
  type CommandApplyTarget,
  type CommandRule,
  type CommandVariable,
  type RoutineEditorResponse,
} from '@trainerpro/shared';
import '../../../../i18n';
import { useApplyProgression, useProgressionPresets } from '../../../../data/hooks/useRoutineProgression';
import { draftRules, emptyDrafts, isDirty, parseValue, toggleIn, type Drafts, type RuleDraft } from './progression-draft';
import { ProgressionPreviewPanel } from './ProgressionPreviewPanel';
import { ProgressionRulesPanel } from './ProgressionRulesPanel';
import { ProgressionSelector } from './ProgressionSelector';
import { isWeekPeriod } from '../routine-period';

type Translate = ReturnType<typeof useTranslation>['t'];

function CascadeQuestion(props: {
  count: number;
  cycleDays: number;
  onAnswer: (cascade: boolean) => void;
  onBack: () => void;
  t: Translate;
}): React.JSX.Element {
  const { t } = props;
  const weekPeriod = isWeekPeriod(props.cycleDays);
  return (
    <Modal
      closeLabel={t('common.close')}
      onClose={props.onBack}
      size="sm"
      title={t(weekPeriod ? 'coach.clientRoutine.command.cascade.title' : 'coach.clientRoutine.command.cascade.cycleTitle')}
      visible
    >
      <View style={styles.stack}>
        <Text style={styles.text}>
          {t(weekPeriod ? 'coach.clientRoutine.command.cascade.body' : 'coach.clientRoutine.command.cascade.cycleBody', {
            count: props.count,
          })}
        </Text>
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

function OpenWeeksNotice(props: { cycleDays: number; t: Translate }): React.JSX.Element {
  const key = isWeekPeriod(props.cycleDays)
    ? 'coach.clientRoutine.command.noOpenWeeks'
    : 'coach.clientRoutine.command.noOpenCycles';
  return <Banner subtitle={props.t(key)} title={props.t('coach.clientRoutine.command.title')} />;
}

function summary(t: Translate, result: CommandApplyResponse, cycleDays: number): string {
  const key = isWeekPeriod(cycleDays) ? 'coach.clientRoutine.command.done' : 'coach.clientRoutine.command.doneCycle';
  return t(key, { sets: result.changedSets, weeks: result.touchedWeeks });
}

function canApplyCommand(rules: CommandRule[], target: CommandApplyTarget, weeks: number): boolean {
  if (rules.length === 0 || weeks === 0) return false;
  return target.scope === 'kind' || target.items.length > 0;
}

function CommandStage(props: {
  asking: boolean;
  canApply: boolean;
  cascadeCount: number;
  confirmCancel: boolean;
  cycleDays: number;
  form: React.ComponentProps<typeof CommandForm>;
  onAnswer: (cascade: boolean) => void;
  onApply: () => void;
  onBack: () => void;
  onCancel: () => void;
  onDiscard: () => void;
  onKeep: () => void;
  open: boolean;
  pending: boolean;
  t: Translate;
}): React.JSX.Element {
  const { t } = props;
  return (
    <Modal
      closeLabel={t('common.close')}
      footer={
        props.open ? (
          <Footer
            canApply={props.canApply}
            confirmCancel={props.confirmCancel}
            onApply={props.onApply}
            onCancel={props.onCancel}
            onDiscard={props.onDiscard}
            onKeep={props.onKeep}
            pending={props.pending}
            t={t}
          />
        ) : undefined
      }
      onClose={props.onCancel}
      size="xl"
      title={t('coach.clientRoutine.command.title')}
      visible
    >
      <View style={styles.stack}>
        {props.open ? <CommandForm {...props.form} /> : <OpenWeeksNotice cycleDays={props.cycleDays} t={t} />}
      </View>
      {props.asking ? (
        <CascadeQuestion
          count={props.cascadeCount}
          cycleDays={props.cycleDays}
          onAnswer={props.onAnswer}
          onBack={props.onBack}
          t={t}
        />
      ) : null}
    </Modal>
  );
}

type OpenWeek = RoutineEditorResponse['weeks'][number];

function CommandForm(props: {
  cycleDays: number;
  dayChoices: Array<{ dayIndex: number; label: string }>;
  dayIndexes: number[];
  drafts: Drafts;
  first: OpenWeek | null;
  onChange: (variable: CommandVariable, patch: Partial<RuleDraft>) => void;
  onRemovePreset: (id: string) => void;
  onSavePreset: (variable: CommandVariable) => void;
  onTarget: (target: CommandApplyTarget) => void;
  onToggleAll: () => void;
  onToggleDay: (dayIndex: number) => void;
  onToggleWeek: (weekId: string) => void;
  open: OpenWeek[];
  presets: ReturnType<typeof useProgressionPresets>['presets'];
  rules: ReturnType<typeof draftRules>;
  selected: string[];
  t: Translate;
  target: CommandApplyTarget;
}): React.JSX.Element {
  return (
    <>
      <ProgressionSelector
        cycleDays={props.cycleDays}
        dayChoices={props.dayChoices}
        days={props.dayIndexes}
        onToggleAll={props.onToggleAll}
        onToggleDay={props.onToggleDay}
        onToggleWeek={props.onToggleWeek}
        selected={props.selected}
        t={props.t}
        weeks={props.open}
      />
      <View style={styles.columns}>
        <ProgressionRulesPanel
          drafts={props.drafts}
          onAddPreset={props.onSavePreset}
          onChange={props.onChange}
          onRemovePreset={props.onRemovePreset}
          presets={props.presets}
          t={props.t}
        />
        <ProgressionPreviewPanel
          cycleDays={props.cycleDays}
          dayIndexes={props.dayIndexes}
          onTarget={props.onTarget}
          rules={props.rules}
          t={props.t}
          target={props.target}
          week={props.first}
        />
      </View>
    </>
  );
}

function useCommandDraft(weeks: RoutineEditorResponse['weeks'], t: Translate) {
  const [weekIds, setWeekIds] = useState<string[]>([]);
  const [dayIndexes, setDayIndexes] = useState<number[]>([]);
  const [drafts, setDrafts] = useState<Drafts>(emptyDrafts);
  const [target, setTarget] = useState<CommandApplyTarget>({ scope: 'kind' });
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [asking, setAsking] = useState(false);
  const open = useMemo(() => weeks.filter((week) => week.phase !== 'completed'), [weeks]);
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
  const canApply = canApplyCommand(rules, target, selectedWeeks.length);
  return {
    asking,
    canApply,
    cascade,
    confirmCancel,
    dayChoices,
    dayIndexes,
    drafts,
    first,
    open,
    rules,
    selectedWeeks,
    setAsking,
    setConfirmCancel,
    setDayIndexes,
    setDrafts,
    setTarget,
    setWeekIds,
    target,
    weekIds,
  };
}

export function ProgressionCommandModal(props: {
  clientId: string;
  onClose: () => void;
  response: RoutineEditorResponse;
}): React.JSX.Element {
  const { t } = useTranslation();
  const cycleDays = props.response.routine?.cycleDays ?? 7;
  const toast = useToast();
  const apply = useApplyProgression(props.clientId);
  const { add, presets, remove } = useProgressionPresets();
  const draft = useCommandDraft(props.response.weeks, t);
  const {
    asking,
    canApply,
    cascade,
    confirmCancel,
    dayChoices,
    dayIndexes,
    drafts,
    first,
    open,
    rules,
    selectedWeeks,
    setAsking,
    setConfirmCancel,
    setDayIndexes,
    setDrafts,
    setTarget,
    setWeekIds,
    target,
    weekIds,
  } = draft;
  const patch = (variable: CommandVariable, change: Partial<RuleDraft>) =>
    setDrafts((current) => ({ ...current, [variable]: { ...current[variable], ...change } }));
  const run = (withCascade: boolean) => {
    setAsking(false);
    apply.mutate(
      { cascade: withCascade, dayIndexes, rules, target, weekIds },
      {
        onError: () => toast.error(t('coach.clientRoutine.command.error')),
        onSuccess: (result) => {
          toast.success(summary(t, result, cycleDays));
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
    <CommandStage
      asking={asking}
      canApply={canApply}
      cascadeCount={cascade.later.length}
      confirmCancel={confirmCancel}
      cycleDays={cycleDays}
      form={{
        cycleDays,
        dayChoices,
        dayIndexes,
        drafts,
        first,
        onChange: patch,
        onRemovePreset: (id) => remove.mutate(id),
        onSavePreset: savePreset,
        onTarget: setTarget,
        onToggleAll: () => setWeekIds(selectedWeeks.length === open.length ? [] : open.map((week) => week.id)),
        onToggleDay: (index) => setDayIndexes((list) => toggleIn(list, index)),
        onToggleWeek: (id) => setWeekIds((list) => toggleIn(list, id)),
        open,
        presets,
        rules,
        selected: weekIds,
        t,
        target,
      }}
      onAnswer={run}
      onApply={() => (cascade.shouldAsk ? setAsking(true) : run(false))}
      onBack={() => setAsking(false)}
      onCancel={requestClose}
      onDiscard={props.onClose}
      onKeep={() => setConfirmCancel(false)}
      open={open.length > 0}
      pending={apply.isPending}
      t={t}
    />
  );
}

const styles = StyleSheet.create({
  actions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'flex-end' },
  columns: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  stack: { gap: space.lg },
  text: { color: colors.text, fontSize: fontSize.sm },
});
