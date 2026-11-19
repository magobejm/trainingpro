import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Banner, Button, EmptyState, FilterChips, Modal, colors, fontSize, space, useToast } from '@trainerpro/ui';
import type { RoutineEditorItemKind, RoutineEditorResponse, RoutineEditorWeek } from '@trainerpro/shared';
import '../../../i18n';
import { LoadingState } from '../../../components/AsyncStatus';
import {
  useClientRoutineActions,
  useClientRoutineQuery,
  useClientRoutineWeekQuery,
} from '../../../data/hooks/useClientRoutine';
import { useFormatDate } from '../../../i18n/useFormatDate';
import { ExercisePickerModal } from '../components/RoutinePlanner/ExercisePickerModal';
import { ProgressionCommandModal } from './command/ProgressionCommandModal';
import { ClientFeedbackModal } from './feedback/ClientFeedbackModal';
import { RoutineDayCard } from './RoutineDayCard';
import { isWeekPeriod } from './routine-period';

type Picker = { dayId: string; mode: 'add' } | { id: string; kind: RoutineEditorItemKind; mode: 'replace' } | null;
type Translate = ReturnType<typeof useTranslation>['t'];

const ADD_TYPES = [
  'strength' as const,
  'cardio' as const,
  'plio' as const,
  'isometric' as const,
  'sport' as const,
  'mobility' as const,
];
const REPLACE_TYPES: Record<RoutineEditorItemKind, Array<(typeof ADD_TYPES)[number]>> = {
  cardio: ['cardio'],
  exercise: ['strength'],
  isometric: ['isometric'],
  mobility: ['mobility'],
  plio: ['plio'],
  sport: ['sport'],
};
const DEFAULT_SETS = 3;

function defaultWeekId(data: RoutineEditorResponse): string {
  const current = data.weeks.find((week) => week.phase === 'current');
  const next = data.weeks.find((week) => week.phase === 'future');
  return (current ?? next ?? data.weeks.at(-1))?.id ?? '';
}

function PhaseBanner(props: { cycleDays: number; t: Translate; week: RoutineEditorWeek }): React.JSX.Element {
  const phase = props.week.phase;
  const weekPeriod = isWeekPeriod(props.cycleDays);
  const hint =
    weekPeriod || phase !== 'future'
      ? `coach.clientRoutine.phase.${phase}.hint`
      : 'coach.clientRoutine.phase.future.cycleHint';
  return (
    <Banner
      subtitle={props.t(hint)}
      title={props.t(`coach.clientRoutine.phase.${phase}.${weekPeriod ? 'title' : 'cycleTitle'}`)}
    />
  );
}

function OlderWeeksDrawer(props: {
  cycleDays: number;
  onClose: () => void;
  onPick: (weekId: string) => void;
  response: RoutineEditorResponse;
  t: Translate;
}): React.JSX.Element {
  const format = useFormatDate();
  const weekPeriod = isWeekPeriod(props.cycleDays);
  const name = weekPeriod ? 'coach.clientRoutine.week' : 'coach.clientRoutine.cycle';
  return (
    <Modal
      closeLabel={props.t('common.close')}
      onClose={props.onClose}
      title={props.t(weekPeriod ? 'coach.clientRoutine.older.title' : 'coach.clientRoutine.older.cycleTitle')}
      visible
    >
      <View style={styles.drawer}>
        {weekPeriod ? null : (
          <Text style={styles.size}>{props.t('coach.clientRoutine.cycleSize', { count: props.cycleDays })}</Text>
        )}
        {props.response.olderWeeks.map((week) => (
          <Button
            key={week.id}
            label={`${props.t(name, { n: week.weekIndex })} · ${format(week.startsOn)}`}
            onPress={() => props.onPick(week.id)}
            variant="secondary"
          />
        ))}
      </View>
    </Modal>
  );
}

function useRoutineWeek(clientId: string, response: RoutineEditorResponse | undefined, selected: string) {
  const known = response?.weeks.find((week) => week.id === selected) ?? null;
  const older = useClientRoutineWeekQuery(clientId, known || !selected ? null : selected);
  return known ?? older.data ?? null;
}

export function ClientRoutineScreen(props: { clientId: string }): React.JSX.Element {
  const { t } = useTranslation();
  const query = useClientRoutineQuery(props.clientId);
  const [picked, setPicked] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [command, setCommand] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const [clientView, setClientView] = useState(false);
  const selected = picked || (query.data ? defaultWeekId(query.data) : '');
  const week = useRoutineWeek(props.clientId, query.data, selected);
  if (query.isLoading) return <LoadingState label={t('coach.clientRoutine.loading')} />;
  if (query.isError || !query.data) return <Text style={styles.empty}>{t('coach.clientRoutine.error')}</Text>;
  if (!query.data.routine) {
    return <EmptyState message={t('coach.clientRoutine.noRoutine.hint')} title={t('coach.clientRoutine.noRoutine.title')} />;
  }
  if (query.data.weeks.length === 0) {
    return <Banner subtitle={t('coach.clientRoutine.noWeeks.hint')} title={t('coach.clientRoutine.noWeeks.title')} />;
  }
  const cycleDays = query.data.routine.cycleDays;
  return (
    <View style={styles.page}>
      <WeekBar
        clientId={props.clientId}
        cycleDays={cycleDays}
        clientView={clientView}
        onToggleView={() => setClientView((value) => !value)}
        onOpenCommand={() => setCommand(true)}
        onOpenFeedback={() => setFeedback(true)}
        onOpenOlder={() => setDrawer(true)}
        onSelect={setPicked}
        response={query.data}
        selected={selected}
        t={t}
      />
      {week ? (
        <WeekPanel clientId={props.clientId} cycleDays={cycleDays} readOnlyView={clientView} t={t} week={week} />
      ) : (
        <LoadingState label={t('coach.clientRoutine.loading')} />
      )}
      {feedback ? (
        <ClientFeedbackModal
          clientId={props.clientId}
          cycleDays={cycleDays}
          onClose={() => setFeedback(false)}
          weeks={query.data.weeks}
        />
      ) : null}
      {command ? (
        <ProgressionCommandModal clientId={props.clientId} onClose={() => setCommand(false)} response={query.data} />
      ) : null}
      {drawer ? (
        <OlderWeeksDrawer
          cycleDays={cycleDays}
          onClose={() => setDrawer(false)}
          onPick={(id) => {
            setPicked(id);
            setDrawer(false);
          }}
          response={query.data}
          t={t}
        />
      ) : null}
    </View>
  );
}

function WeekBar(props: {
  clientId: string;
  clientView: boolean;
  cycleDays: number;
  onToggleView: () => void;
  onOpenCommand: () => void;
  onOpenFeedback: () => void;
  onOpenOlder: () => void;
  onSelect: (id: string) => void;
  response: RoutineEditorResponse;
  selected: string;
  t: Translate;
}): React.JSX.Element {
  const items = useMemo(
    () =>
      props.response.weeks.map((week) => ({
        id: week.id,
        label: props.t(isWeekPeriod(props.cycleDays) ? 'coach.clientRoutine.week' : 'coach.clientRoutine.cycle', {
          n: week.weekIndex,
        }),
      })),
    [props.cycleDays, props.response.weeks, props.t],
  );
  return (
    <View style={styles.bar}>
      <View style={styles.chips}>
        <FilterChips activeId={props.selected} items={items} onSelect={props.onSelect} />
        {isWeekPeriod(props.cycleDays) ? null : (
          <Text style={styles.size}>{props.t('coach.clientRoutine.cycleSize', { count: props.cycleDays })}</Text>
        )}
      </View>
      <View style={styles.actions}>
        {props.clientView ? null : (
          <Button label={props.t('coach.clientRoutine.command.open')} onPress={props.onOpenCommand} size="sm" />
        )}
        <Button
          label={props.t(props.clientView ? 'coach.clientRoutine.view.coach' : 'coach.clientRoutine.view.client')}
          onPress={props.onToggleView}
          size="sm"
          variant="secondary"
        />
        <Button label={props.t('coach.clientFeedback.open')} onPress={props.onOpenFeedback} size="sm" variant="secondary" />
        {props.response.olderWeeks.length > 0 ? (
          <Button
            label={props.t(
              isWeekPeriod(props.cycleDays) ? 'coach.clientRoutine.older.open' : 'coach.clientRoutine.older.cycleOpen',
              { count: props.response.olderWeeks.length },
            )}
            onPress={props.onOpenOlder}
            size="sm"
            variant="secondary"
          />
        ) : null}
      </View>
    </View>
  );
}

function WeekPanel(props: {
  clientId: string;
  cycleDays: number;
  readOnlyView: boolean;
  t: Translate;
  week: RoutineEditorWeek;
}): React.JSX.Element {
  const { t, week } = props;
  const toast = useToast();
  const actions = useClientRoutineActions(props.clientId, week.id);
  const [picker, setPicker] = useState<Picker>(null);
  const fail = () => toast.error(t('coach.clientRoutine.saveError'));
  return (
    <View style={styles.page}>
      <PhaseBanner cycleDays={props.cycleDays} t={t} week={week} />
      {week.days.map((source) => {
        const day = props.readOnlyView ? { ...source, editable: false } : source;
        return (
          <RoutineDayCard
            cycleDays={props.cycleDays}
            actions={{
              onAddExercise: (dayId) => setPicker({ dayId, mode: 'add' }),
              warmup: {
                onAddItem: (ref, item) => actions.addWarmupItem.mutate({ item, ref }, { onError: fail }),
                onAddSet: (ref) => actions.addWarmupSet.mutate(ref, { onError: fail }),
                onMeta: (ref, meta) => actions.updateWarmupItem.mutate({ meta, ref }, { onError: fail }),
                onPatchSet: (ref, setId, patch) => actions.patchWarmupSet.mutate({ patch, ref, setId }, { onError: fail }),
                onRemoveItem: (ref) => actions.removeWarmupItem.mutate(ref, { onError: fail }),
                onRemoveSet: (ref, setId) => actions.removeWarmupSet.mutate({ ref, setId }, { onError: fail }),
                onReplaceItem: (ref, next) => actions.replaceWarmupItem.mutate({ ...next, ref }, { onError: fail }),
              },
              onWarmups: (dayId, warmupTemplateIds) =>
                actions.setWarmups.mutate({ dayId, warmupTemplateIds }, { onError: fail }),
              onGroup: (dayId, items, groupType) => actions.setGroup.mutate({ dayId, groupType, items }, { onError: fail }),
              onAddSet: (ref) => actions.addSet.mutate(ref, { onError: fail }),
              onDuplicate: (ref) => actions.duplicateItem.mutate(ref, { onError: fail }),
              onMeta: (ref, meta) => actions.updateMeta.mutate({ meta, ref }, { onError: fail }),
              onMove: (ref, direction) => actions.moveItem.mutate({ direction, ref }, { onError: fail }),
              onPlace: async (ref, toIndex) => {
                try {
                  await actions.moveItem.mutateAsync({ ref, toIndex });
                } catch (error) {
                  fail();
                  throw error;
                }
              },
              onPatchSet: (ref, setId, patch) => actions.patchItemSet.mutate({ patch, ref, setId }, { onError: fail }),
              onRemoveItem: (ref) =>
                ref.kind === 'exercise'
                  ? actions.removeExercise.mutate(ref.id, { onError: fail })
                  : actions.removeItem.mutate(ref, { onError: fail }),
              onRemoveSet: (ref, setId) => actions.removeSet.mutate({ ref, setId }, { onError: fail }),
              onReplace: (ref) => setPicker({ id: ref.id, kind: ref.kind, mode: 'replace' }),
            }}
            day={day}
            key={day.id}
            t={t}
          />
        );
      })}
      <ExercisePickerModal
        allowedTypes={picker?.mode === 'replace' ? REPLACE_TYPES[picker.kind] : ADD_TYPES}
        title={picker?.mode === 'replace' ? t('coach.clientRoutine.replace') : undefined}
        blockType={picker ? (picker.mode === 'replace' && picker.kind !== 'exercise' ? picker.kind : 'strength') : null}
        onCancel={() => setPicker(null)}
        onSelect={(exerciseLibraryId, displayName, kind) => {
          if (picker?.mode === 'add' && kind && kind !== 'strength') {
            const block = { displayName, kind, libraryId: exerciseLibraryId };
            actions.addBlock.mutate({ block, dayId: picker.dayId }, { onError: fail });
          } else if (picker?.mode === 'add') {
            const sets = Array.from({ length: DEFAULT_SETS }, () => ({}));
            const exercise = { displayName, exerciseLibraryId, sets };
            actions.addExercise.mutate({ dayId: picker.dayId, exercise }, { onError: fail });
          }
          if (picker?.mode === 'replace') {
            const ref = { id: picker.id, kind: picker.kind };
            actions.replaceItem.mutate({ displayName, libraryId: exerciseLibraryId, ref }, { onError: fail });
            setPicker(null);
          }
        }}
        t={t as never}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  bar: { gap: space.md },
  chips: { maxWidth: '100%', width: '100%' },
  drawer: { gap: space.sm },
  empty: { color: colors.textMuted, fontSize: fontSize.sm },
  size: { color: colors.textMuted, fontSize: fontSize.xs },
  page: { gap: space.lg, padding: space.md },
});
