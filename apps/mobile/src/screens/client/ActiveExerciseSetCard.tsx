import React, { useState } from 'react';
import { useHeartRateProposal } from '../../health/use-heart-rate';
import { StyleSheet, Text, View } from 'react-native';
import type { TFunction } from 'i18next';
import type { ExerciseHistoryEntry } from '@trainerpro/shared';
import { LIGHT } from '../../theme/light';
import { useRestPreferencesStore } from '../../store/rest-preferences.store';
import { saveSetAndMaybeRest } from '../../features/timers/rest-shift';
import { CircularCountdown } from './CircularCountdown';
import { CurrentSetFields, SetRestControl, SetSaveButton } from './ActiveExerciseSetPanel';
import { SetCopyActions } from './SetCopyActions';
import { WeightCalculatorModal } from './WeightCalculatorModal';
import { bestE1rm } from './barbell-load';
import { draftHasCopy, historyDraft, matchHistorySet, sourceOccurrence, targetDraft } from './set-copy';
import {
  getRestSeconds,
  getSetColumns,
  readTargetValue,
  restWasRecorded,
  type SetRowState,
} from './active-exercise.helpers';
import { loggedDraft, setDraftMatchesLogged } from './active-exercise.save';
import { useActiveSetDraft } from './active-exercise.draft';
import { useActiveSetSave } from './active-exercise.session';
import type { SessionItem } from '../../data/hooks/useTodaySession';
import type { RestState } from './session-rest.types';

type SetCardScreen = {
  completedRestKeys: string[];
  exerciseGroup: SessionItem[];
  item: SessionItem;
  onExpandRest: () => void;
  onStartRest: (setKey: string, seconds: number) => void;
  readOnly?: boolean;
  restState: RestState | null;
};

export function ExerciseSetCard(props: {
  draft: ReturnType<typeof useActiveSetDraft>;
  history: ExerciseHistoryEntry[];
  onFocus: (node: number) => void;
  remaining: number | null;
  save: ReturnType<typeof useActiveSetSave>;
  screen: SetCardScreen;
  setIndex: number;
  t: TFunction;
}): React.JSX.Element {
  const view = readSetView(
    props.screen.item,
    props.setIndex,
    props.draft.drafts[props.setIndex],
    props.save.restSeconds.current[props.setIndex],
  );
  const rest = useSetRest(props, view.setKey);
  const autoStart = useRestPreferencesStore((state) => state.autoStartRest);
  const [calculator, setCalculator] = useState(false);
  const heart = useHeartRateProposal(props.screen.item.type, props.setIndex, props.draft);
  const values = setCopy(props);
  return (
    <View style={styles.setCard}>
      <View style={styles.setHeader}>
        <Text style={styles.setTitle}>{`${props.t('client.today.set')} ${props.setIndex}`}</Text>
        {rest.seconds > 0 ? (
          <SetRestControl
            active={rest.active}
            completed={rest.done}
            countdown={<RestCountdown remaining={props.remaining} total={rest.seconds} />}
            disabled={props.screen.readOnly === true || (props.screen.restState != null && !rest.active)}
            onExpand={props.screen.onExpandRest}
            onStart={() => props.screen.onStartRest(view.setKey, rest.seconds)}
            remaining={rest.active ? props.remaining : null}
            restSeconds={rest.seconds}
            t={props.t}
          />
        ) : null}
      </View>
      <SetCopyActions
        lastEnabled={values.lastEnabled}
        onCopyLast={() => props.draft.replaceSet(props.setIndex, values.last)}
        onCopyTarget={() => props.draft.replaceSet(props.setIndex, values.target)}
        readOnly={props.screen.readOnly}
        t={props.t}
        targetEnabled={values.targetEnabled}
      />
      <CurrentSetFields
        columns={view.columns}
        draft={props.draft.drafts[props.setIndex] ?? loggedDraft(props.screen.item, props.setIndex)}
        onChange={(key, value) => props.draft.updateField(props.setIndex, key, value)}
        onFocus={props.onFocus}
        onOpenRom={() => props.draft.setRomSet(props.setIndex)}
        onOpenWeight={props.screen.readOnly ? undefined : () => setCalculator(true)}
        readOnly={props.screen.readOnly}
        t={props.t}
        targets={view.targets}
      />
      {heart ? <Text style={styles.setTitle}>{props.t('mobile.client.health.heartRate', heart)}</Text> : null}
      <WeightCalculatorModal
        e1rm={values.e1rm}
        initialWeight={values.initialWeight}
        onClose={() => setCalculator(false)}
        onUse={(weight) => applyWeight(props, weight, setCalculator)}
        reps={values.reps}
        visible={calculator}
      />
      {props.screen.readOnly ? null : (
        <SetSaveButton
          busy={props.save.busy || props.save.finishing}
          clean={view.clean}
          onSave={() => void saveCurrentSet(props, rest.done, rest.seconds, view.setKey, autoStart)}
          setIndex={props.setIndex}
          t={props.t}
        />
      )}
    </View>
  );
}

function applyWeight(
  props: { draft: ReturnType<typeof useActiveSetDraft>; setIndex: number },
  weight: string,
  close: (open: boolean) => void,
): void {
  props.draft.updateField(props.setIndex, 'weight', weight);
  close(false);
}

function useSetRest(props: { screen: SetCardScreen; setIndex: number }, setKey: string) {
  const seconds = getRestSeconds(props.screen.item, props.setIndex);
  const active = props.screen.restState?.setKey === setKey;
  const markedDone = props.screen.completedRestKeys.includes(setKey);
  return { active, done: markedDone || restWasRecorded(props.screen.item, props.setIndex), seconds };
}

function saveCurrentSet(
  props: { save: ReturnType<typeof useActiveSetSave>; screen: SetCardScreen; setIndex: number },
  restDone: boolean,
  restSeconds: number,
  setKey: string,
  autoStart: boolean,
): void {
  void saveSetAndMaybeRest({
    enabled: autoStart,
    readOnly: props.screen.readOnly === true,
    restActive: props.screen.restState != null,
    restDone,
    restSeconds,
    run: () => props.save.run([props.setIndex]),
    start: () => props.screen.onStartRest(setKey, restSeconds),
  });
}

function setCopy(props: {
  draft: ReturnType<typeof useActiveSetDraft>;
  history: ExerciseHistoryEntry[];
  screen: SetCardScreen;
  setIndex: number;
}) {
  const target = targetDraft(props.screen.item, props.setIndex);
  const occurrence = sourceOccurrence(props.screen.exerciseGroup, props.screen.item);
  const matched = matchHistorySet(props.history, props.setIndex, occurrence);
  const last = matched ? historyDraft(props.screen.item, matched) : {};
  const row = props.draft.drafts[props.setIndex];
  const reps = Number((row?.reps || target.reps || '5').replace(',', '.'));
  return {
    e1rm: bestE1rm(props.history.flatMap((entry) => entry.sets)),
    initialWeight: row?.weight || target.weight || '',
    last,
    lastEnabled: draftHasCopy(last),
    reps: Number.isFinite(reps) && reps > 0 ? reps : 5,
    target,
    targetEnabled: draftHasCopy(target),
  };
}

function readSetView(item: SessionItem, setIndex: number, draft: SetRowState | undefined, restSeconds?: number) {
  const columns = getSetColumns(item);
  return {
    clean: setDraftMatchesLogged(item, setIndex, draft ?? loggedDraft(item, setIndex), restSeconds),
    columns,
    setKey: `${item.id}:${setIndex}`,
    targets: Object.fromEntries(columns.map((column) => [column.key, readTargetValue(item, setIndex, column.key)])),
  };
}

function RestCountdown(props: { remaining: number | null; total: number }): React.JSX.Element {
  return <CircularCountdown remaining={props.remaining ?? 0} size={40} strokeWidth={4} totalSeconds={props.total} />;
}

const styles = StyleSheet.create({
  setCard: {
    backgroundColor: LIGHT.bgCard,
    borderColor: LIGHT.border,
    borderRadius: LIGHT.radius2xl,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  setHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  setTitle: { color: LIGHT.textStrong, flex: 1, fontSize: 16, fontWeight: '800' },
});
