import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Banner, Button, EmptyState, FilterChips, Modal, colors, fontSize, space, useToast } from '@trainerpro/ui';
import type { RoutineEditorResponse, RoutineEditorWeek } from '@trainerpro/shared';
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

type Picker = { dayId: string; mode: 'add' } | { exerciseId: string; mode: 'replace' } | null;
type Translate = ReturnType<typeof useTranslation>['t'];

const PICKER_TYPES = ['strength' as const];
const DEFAULT_SETS = 3;

function defaultWeekId(data: RoutineEditorResponse): string {
  const current = data.weeks.find((week) => week.phase === 'current');
  const next = data.weeks.find((week) => week.phase === 'future');
  return (current ?? next ?? data.weeks.at(-1))?.id ?? '';
}

function PhaseBanner(props: { t: Translate; week: RoutineEditorWeek }): React.JSX.Element {
  return (
    <Banner
      subtitle={props.t(`coach.clientRoutine.phase.${props.week.phase}.hint`)}
      title={props.t(`coach.clientRoutine.phase.${props.week.phase}.title`)}
    />
  );
}

function OlderWeeksDrawer(props: {
  onClose: () => void;
  onPick: (weekId: string) => void;
  response: RoutineEditorResponse;
  t: Translate;
}): React.JSX.Element {
  const format = useFormatDate();
  return (
    <Modal
      closeLabel={props.t('common.close')}
      onClose={props.onClose}
      title={props.t('coach.clientRoutine.older.title')}
      visible
    >
      <View style={styles.drawer}>
        {props.response.olderWeeks.map((week) => (
          <Button
            key={week.id}
            label={`${props.t('coach.clientRoutine.week', { n: week.weekIndex })} · ${format(week.startsOn)}`}
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
  return (
    <View style={styles.page}>
      <WeekBar
        clientId={props.clientId}
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
        <WeekPanel clientId={props.clientId} readOnlyView={clientView} t={t} week={week} />
      ) : (
        <LoadingState label={t('coach.clientRoutine.loading')} />
      )}
      {feedback ? (
        <ClientFeedbackModal clientId={props.clientId} onClose={() => setFeedback(false)} weeks={query.data.weeks} />
      ) : null}
      {command ? (
        <ProgressionCommandModal clientId={props.clientId} onClose={() => setCommand(false)} response={query.data} />
      ) : null}
      {drawer ? (
        <OlderWeeksDrawer
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
        label: props.t('coach.clientRoutine.week', { n: week.weekIndex }),
      })),
    [props.response.weeks, props.t],
  );
  return (
    <View style={styles.bar}>
      <FilterChips activeId={props.selected} items={items} onSelect={props.onSelect} />
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
          label={props.t('coach.clientRoutine.older.open', { count: props.response.olderWeeks.length })}
          onPress={props.onOpenOlder}
          size="sm"
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

function WeekPanel(props: {
  clientId: string;
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
      <PhaseBanner t={t} week={week} />
      {week.days.map((source) => {
        const day = props.readOnlyView ? { ...source, editable: false } : source;
        return (
          <RoutineDayCard
            actions={{
              onAddExercise: (dayId) => setPicker({ dayId, mode: 'add' }),
              onGroup: (dayId, exerciseIds, groupType) =>
                actions.setGroup.mutate({ dayId, exerciseIds, groupType }, { onError: fail }),
              onPatchSet: (setId, patch) => actions.updateSet.mutate({ patch, setId }, { onError: fail }),
              onRemoveExercise: (exerciseId) => actions.removeExercise.mutate(exerciseId, { onError: fail }),
              onReplaceExercise: (exerciseId) => setPicker({ exerciseId, mode: 'replace' }),
            }}
            day={day}
            key={day.id}
            t={t}
          />
        );
      })}
      <ExercisePickerModal
        allowedTypes={PICKER_TYPES}
        blockType={picker ? 'strength' : null}
        onCancel={() => setPicker(null)}
        onSelect={(exerciseLibraryId, displayName) => {
          if (picker?.mode === 'add') {
            const sets = Array.from({ length: DEFAULT_SETS }, () => ({}));
            const exercise = { displayName, exerciseLibraryId, sets };
            actions.addExercise.mutate({ dayId: picker.dayId, exercise }, { onError: fail });
          }
          if (picker?.mode === 'replace') {
            const next = { displayName, exerciseId: picker.exerciseId, exerciseLibraryId };
            actions.replaceExercise.mutate(next, { onError: fail });
            setPicker(null);
          }
        }}
        t={t as never}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  drawer: { gap: space.sm },
  empty: { color: colors.textMuted, fontSize: fontSize.sm },
  page: { gap: space.lg, padding: space.md },
});
