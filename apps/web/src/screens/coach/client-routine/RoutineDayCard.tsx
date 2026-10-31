import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, colors, fontSize, space, type BadgeTone } from '@trainerpro/ui';
import type { RoutineEditorDay, RoutineEditorSetPatch } from '@trainerpro/shared';
import { DayGrouping, type OnGroup } from './DayGrouping';
import { DayWarmups, type OnWarmups } from './DayWarmups';
import { RoutineSetGrid } from './RoutineSetGrid';

type Translate = (key: string) => string;

const OUTCOME_TONE: Record<string, BadgeTone> = {
  done: 'success',
  in_progress: 'info',
  incomplete: 'warning',
  pending: 'neutral',
  skipped: 'neutral',
};

export type RoutineDayActions = {
  onAddExercise: (dayId: string) => void;
  onGroup: OnGroup;
  onWarmups: OnWarmups;
  onPatchSet: (setId: string, patch: RoutineEditorSetPatch) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onReplaceExercise: (exerciseId: string) => void;
};

function DayHeader(props: { day: RoutineEditorDay; t: Translate }): React.JSX.Element {
  const { day, t } = props;
  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{day.title}</Text>
        <Text style={styles.dates}>{day.scheduledDates.join(' · ') || t('coach.clientRoutine.unscheduled')}</Text>
      </View>
      <View style={styles.badges}>
        <Badge
          label={t(`coach.clientRoutine.outcome.${day.outcome ?? 'pending'}`)}
          tone={OUTCOME_TONE[day.outcome ?? 'pending']}
        />
        {day.editable ? null : <Badge label={t('coach.clientRoutine.readOnly')} tone="neutral" />}
      </View>
    </View>
  );
}

function ExerciseActions(props: { actions: RoutineDayActions; exerciseId: string; t: Translate }): React.JSX.Element {
  return (
    <View style={styles.actions}>
      <Button
        label={props.t('coach.clientRoutine.replace')}
        onPress={() => props.actions.onReplaceExercise(props.exerciseId)}
        size="sm"
        variant="secondary"
      />
      <Button
        label={props.t('coach.clientRoutine.remove')}
        onPress={() => props.actions.onRemoveExercise(props.exerciseId)}
        size="sm"
        variant="secondary"
      />
    </View>
  );
}

export function RoutineDayCard(props: {
  actions: RoutineDayActions;
  day: RoutineEditorDay;
  t: Translate;
}): React.JSX.Element {
  const { actions, day, t } = props;
  return (
    <Card>
      <View style={styles.body}>
        <DayHeader day={day} t={t} />
        {day.editable || day.warmups.length > 0 ? (
          <DayWarmups day={day} onChange={day.editable ? actions.onWarmups : () => undefined} t={t} />
        ) : null}
        {day.editable ? <DayGrouping day={day} onGroup={actions.onGroup} t={t} /> : null}
        {day.exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exercise}>
            <View style={styles.exerciseHead}>
              <Text style={styles.exerciseName}>{exercise.displayName}</Text>
              {day.editable ? <ExerciseActions actions={actions} exerciseId={exercise.id} t={t} /> : null}
            </View>
            <RoutineSetGrid editable={day.editable} exercise={exercise} onPatch={actions.onPatchSet} t={t} />
          </View>
        ))}
        {day.blocks.length > 0 ? (
          <Text style={styles.dates}>
            {`${t('coach.clientRoutine.otherBlocks')}: ${day.blocks.map((block) => block.displayName).join(', ')}`}
          </Text>
        ) : null}
        {day.editable ? (
          <Button
            label={t('coach.clientRoutine.addExercise')}
            onPress={() => actions.onAddExercise(day.id)}
            size="sm"
            variant="secondary"
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: space.sm },
  badges: { flexDirection: 'row', gap: space.sm },
  body: { gap: space.md },
  dates: { color: colors.textMuted, fontSize: fontSize.xs },
  exercise: { gap: space.sm },
  exerciseHead: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    justifyContent: 'space-between',
  },
  exerciseName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  header: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  titleBlock: { gap: 2 },
});
